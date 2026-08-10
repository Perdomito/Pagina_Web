from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models import Usuario, Miembro, Contacto, EstudioDiario, EstadisticaPais, Pais, Ciudad, Iglesia
from app.schemas import (
    EstadisticasOut, ComparacionEstudios, SerieData,
    RendimientoProfesores, ProfesorRendimiento,
    EvangelismoProfesores, ProfesorEvangelismo,
    CrecimientoEstudiantes, SeriesPorTipo, ResumenPaisStats,
)

router = APIRouter(prefix="/estadisticas", tags=["Estadisticas Generales"])

MESES_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

# Fuente unica de verdad: estudios_diarios. La tabla reportes guarda los mismos
# datos preagregados pero ya nadie la escribe, y sus totales no cuadran con los
# que muestran Reportes.jsx / EstudiosBiblicos.jsx (que ya leen de aqui).
#
# Las tres clases de fila son las mismas que particiona Reportes.jsx:
#   estudio     -> contacto_id NOT NULL          (un estudio dado a un contacto)
#   evangelismo -> contacto_id NULL, tipo NOT NULL (horas de calle/online)
#   contadores  -> contacto_id NULL, tipo NULL     (dijeron_si, nuevos, potenciales)
ES_ESTUDIO = EstudioDiario.contacto_id.isnot(None)
ES_EVANGELISMO = and_(EstudioDiario.contacto_id.is_(None), EstudioDiario.tipo.isnot(None))


def _filtrar(query, anio: int | None = None, pais_id: int | None = None):
    if anio is not None:
        query = query.where(EstudioDiario.anio == anio)
    if pais_id is not None:
        query = query.where(EstudioDiario.pais_id == pais_id)
    return query


@router.get("", response_model=EstadisticasOut)
async def obtener_estadisticas(
    anio: int | None = Query(None),
    pais_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if anio is None:
        anio_result = await db.execute(select(func.max(EstudioDiario.anio)))
        anio = anio_result.scalar() or 2025

    total_usuarios = (await db.execute(select(func.count(Usuario.id)))).scalar() or 0

    miembros_query = select(func.count(Miembro.id))
    contactos_query = select(func.count(Contacto.id))
    # Antes contaba filas de reportes (170 en total) y las devolvia como
    # "estudios": ahora cuenta los estudios de verdad.
    estudios_query = _filtrar(
        select(func.count(EstudioDiario.id)).where(ES_ESTUDIO), anio, pais_id
    )

    if pais_id is not None:
        miembros_query = miembros_query.where(Miembro.pais_id == pais_id)
        contactos_query = contactos_query.where(Contacto.pais_id == pais_id)

    total_miembros = (await db.execute(miembros_query)).scalar() or 0
    total_contactos = (await db.execute(contactos_query)).scalar() or 0
    total_estudios = (await db.execute(estudios_query)).scalar() or 0

    anios_result = await db.execute(
        _filtrar(select(EstudioDiario.anio).distinct(), None, pais_id)
        .order_by(EstudioDiario.anio.desc())
    )
    anios_disponibles = [a for a in anios_result.scalars().all() if a is not None]

    comparacion = await _build_comparacion_estudios(db, anio, pais_id)
    rendimiento = await _build_rendimiento_profesores(db, anio, pais_id)
    evangelismo = await _build_evangelismo_profesores(db, anio, pais_id)
    crecimiento_est = await _build_crecimiento_estudiantes(db, anio, pais_id)
    crecimiento_miembros = await _build_crecimiento_miembros(db, anio, pais_id)
    resumen_pais = await _build_resumen_pais(db, pais_id)

    return EstadisticasOut(
        total_usuarios=total_usuarios,
        total_miembros=total_miembros,
        total_contactos=total_contactos,
        total_estudios=total_estudios,
        comparacion_estudios=comparacion,
        rendimiento_profesores=rendimiento,
        evangelismo_profesores=evangelismo,
        crecimiento_estudiantes=crecimiento_est,
        crecimiento_miembros=crecimiento_miembros,
        resumen_pais=resumen_pais,
        anio_seleccionado=anio,
        anios_disponibles=anios_disponibles,
    )


async def _build_comparacion_estudios(db: AsyncSession, anio: int, pais_id: int | None = None) -> ComparacionEstudios:
    anio_anterior = anio - 1
    data_actual = [0] * 12
    data_anterior = [0] * 12

    # La version anterior agrupaba por (anio, mes) pero solo seleccionaba mes, asi
    # que no habia forma de saber a que anio pertenecia cada fila y el bucle
    # quedo en 'pass': las dos series salian siempre en cero.
    query = _filtrar(
        select(EstudioDiario.anio, EstudioDiario.mes, func.count(EstudioDiario.id))
        .where(ES_ESTUDIO, EstudioDiario.anio.in_([anio, anio_anterior]))
        .group_by(EstudioDiario.anio, EstudioDiario.mes),
        None, pais_id,
    )

    result = await db.execute(query)
    for fila_anio, mes, total in result.all():
        mes_idx = (mes or 1) - 1
        if 0 <= mes_idx < 12:
            destino = data_actual if fila_anio == anio else data_anterior
            destino[mes_idx] = int(total or 0)

    serie_actual = SerieData(etiqueta=str(anio), data=data_actual)
    serie_anterior = SerieData(etiqueta=str(anio_anterior), data=data_anterior)

    total_actual = sum(data_actual)
    total_anterior = sum(data_anterior)
    crecimiento = None
    diferencia = None
    if total_anterior > 0:
        crecimiento = round(((total_actual - total_anterior) / total_anterior) * 100, 1)
        diferencia = total_actual - total_anterior

    return ComparacionEstudios(
        labels=MESES_LABELS,
        serie_actual=serie_actual,
        serie_anterior=serie_anterior if any(data_anterior) else None,
        crecimiento=crecimiento,
        diferencia=diferencia,
    )


async def _build_rendimiento_profesores(db: AsyncSession, anio: int, pais_id: int | None = None) -> RendimientoProfesores:
    query = _filtrar(
        select(
            EstudioDiario.miembro_id,
            Miembro.nombre,
            func.count(EstudioDiario.id).label("total_estudios"),
        )
        .join(Miembro, EstudioDiario.miembro_id == Miembro.id)
        .where(ES_ESTUDIO)
        .group_by(EstudioDiario.miembro_id, Miembro.nombre)
        .order_by(func.count(EstudioDiario.id).desc()),
        anio, pais_id,
    )

    result = await db.execute(query)
    profesores = []
    for row in result.all():
        total = row[2] or 0
        profesores.append(ProfesorRendimiento(
            id=row[0] or "",
            nombre=row[1] or "",
            total_estudios=total,
            promedio_mensual=round(total / 12, 1) if total > 0 else 0,
            promedio_diario=round(total / 365, 2) if total > 0 else 0,
        ))
    return RendimientoProfesores(anio=anio, profesores=profesores)


async def _build_evangelismo_profesores(db: AsyncSession, anio: int, pais_id: int | None = None) -> EvangelismoProfesores:
    # estudios_diarios.horas ya viene en horas; reportes.tiempo_evangelizacion era
    # un Interval que habia que convertir.
    query = _filtrar(
        select(
            EstudioDiario.miembro_id,
            Miembro.nombre,
            func.sum(EstudioDiario.horas).label("total_horas"),
        )
        .join(Miembro, EstudioDiario.miembro_id == Miembro.id)
        .where(ES_EVANGELISMO)
        .group_by(EstudioDiario.miembro_id, Miembro.nombre)
        .order_by(func.sum(EstudioDiario.horas).desc()),
        anio, pais_id,
    )

    result = await db.execute(query)
    profesores = []
    for miembro_id, nombre, total_horas in result.all():
        profesores.append(ProfesorEvangelismo(
            id=miembro_id or "",
            nombre=nombre or "",
            total_horas=round(float(total_horas or 0), 1),
        ))

    anios_query = _filtrar(
        select(EstudioDiario.anio).distinct(), None, pais_id
    ).order_by(EstudioDiario.anio.desc())
    anios_result = await db.execute(anios_query)
    anios_disponibles = [int(a) for a in anios_result.scalars().all() if a is not None]

    return EvangelismoProfesores(
        profesores=profesores,
        modo="anual",
        anio=anio,
        anio_comparacion=anio - 1 if anio - 1 in anios_disponibles else None,
        anios_disponibles=anios_disponibles,
    )


async def _build_crecimiento_estudiantes(db: AsyncSession, anio: int, pais_id: int | None = None) -> CrecimientoEstudiantes:
    serie = [0] * 12
    # Estudiantes distintos atendidos cada mes, no la suma de un contador manual.
    query = _filtrar(
        select(EstudioDiario.mes, func.count(func.distinct(EstudioDiario.contacto_id)))
        .where(ES_ESTUDIO)
        .group_by(EstudioDiario.mes),
        anio, pais_id,
    )

    result = await db.execute(query)
    for mes, total in result.all():
        if mes and 1 <= mes <= 12:
            serie[mes - 1] = int(total or 0)
    return CrecimientoEstudiantes(serie=serie, labels=MESES_LABELS, anio=anio)


async def _build_crecimiento_miembros(db: AsyncSession, anio: int, pais_id: int | None = None) -> SeriesPorTipo:
    tipos = ["Todos", "Comprometido", "Registrado", "Voluntario"]
    series_por_tipo = {}

    anios_query = select(func.distinct(EstadisticaPais.anio)).order_by(EstadisticaPais.anio.desc())
    if pais_id is not None:
        anios_query = anios_query.where(EstadisticaPais.pais_id == pais_id)
    anios_result = await db.execute(anios_query)
    anios_disponibles = [a for a in anios_result.scalars().all() if a is not None]

    query = (
        select(EstadisticaPais.mes, func.sum(EstadisticaPais.cantidad_miembros))
        .where(EstadisticaPais.anio == anio)
        .group_by(EstadisticaPais.mes)
    )
    if pais_id is not None:
        query = query.where(EstadisticaPais.pais_id == pais_id)

    result = await db.execute(query)
    data = {}
    for row in result.all():
        if row[0] and 1 <= row[0] <= 12:
            data[row[0]] = int(row[1] or 0)
    serie = [data.get(m, 0) for m in range(1, 13)]

    series_por_tipo["Todos"] = {str(anio): serie}
    series_por_tipo["Comprometido"] = {str(anio): serie}
    series_por_tipo["Registrado"] = {str(anio): serie}
    series_por_tipo["Voluntario"] = {str(anio): serie}

    return SeriesPorTipo(
        series_por_tipo=series_por_tipo,
        tipos_disponibles=tipos,
        anios_disponibles=anios_disponibles,
    )


async def _build_resumen_pais(db: AsyncSession, pais_id: int | None) -> ResumenPaisStats | None:
    if pais_id is None:
        return None

    pais = await db.get(Pais, pais_id)
    if not pais:
        return None

    cantidad_miembros = (
        await db.execute(
            select(func.count(Miembro.id)).where(Miembro.pais_id == pais_id)
        )
    ).scalar() or 0

    # Iglesias activas del pais. Se aceptan las que quedaron sin pais_id
    # resolviendo por la ciudad, para no perder filas cargadas a medias.
    cantidad_iglesias = (
        await db.execute(
            select(func.count(Iglesia.id))
            .outerjoin(Ciudad, Iglesia.ciudad_id == Ciudad.id)
            .where(
                Iglesia.activa.is_(True),
                (Iglesia.pais_id == pais_id) | (Ciudad.pais_iso2 == pais.iso),
            )
        )
    ).scalar() or 0

    return ResumenPaisStats(
        pais_id=pais.id,
        nombre_pais=pais.nombre,
        cantidad_iglesias=int(cantidad_iglesias),
        cantidad_miembros=int(cantidad_miembros),
    )
