from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from app.database import get_db
from app.models import Usuario, Miembro, Contacto, Reporte, EstadisticaPais
from app.schemas import (
    EstadisticasOut, ComparacionEstudios, SerieData,
    RendimientoProfesores, ProfesorRendimiento,
    EvangelismoProfesores, ProfesorEvangelismo,
    CrecimientoEstudiantes, SeriesPorTipo,
)

router = APIRouter(prefix="/estadisticas", tags=["Estadisticas Generales"])

MESES_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]


@router.get("", response_model=EstadisticasOut)
async def obtener_estadisticas(
    anio: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if anio is None:
        anio_result = await db.execute(select(func.max(EstadisticaPais.anio)))
        anio = anio_result.scalar() or 2025

    total_usuarios = (await db.execute(select(func.count(Usuario.id)))).scalar() or 0
    total_miembros = (await db.execute(select(func.count(Miembro.id)))).scalar() or 0
    total_contactos = (await db.execute(select(func.count(Contacto.id)))).scalar() or 0
    total_reportes = (await db.execute(select(func.count(Reporte.id)))).scalar() or 0

    anios_result = await db.execute(
        select(EstadisticaPais.anio).distinct().order_by(EstadisticaPais.anio.desc())
    )
    anios_disponibles = [a for a in anios_result.scalars().all()]

    comparacion = await _build_comparacion_estudios(db, anio)
    rendimiento = await _build_rendimiento_profesores(db, anio)
    evangelismo = await _build_evangelismo_profesores(db, anio)
    crecimiento_est = await _build_crecimiento_estudiantes(db, anio)
    crecimiento_miembros = await _build_crecimiento_miembros(db, anio)

    return EstadisticasOut(
        total_usuarios=total_usuarios,
        total_miembros=total_miembros,
        total_contactos=total_contactos,
        total_estudios=total_reportes,
        comparacion_estudios=comparacion,
        rendimiento_profesores=rendimiento,
        evangelismo_profesores=evangelismo,
        crecimiento_estudiantes=crecimiento_est,
        crecimiento_miembros=crecimiento_miembros,
        anio_seleccionado=anio,
        anios_disponibles=anios_disponibles,
    )


async def _build_comparacion_estudios(db: AsyncSession, anio: int) -> ComparacionEstudios:
    anio_anterior = anio - 1
    data_actual = [0] * 12
    data_anterior = [0] * 12

    result = await db.execute(
        select(EstadisticaPais.mes, func.sum(EstadisticaPais.cantidad_estudios))
        .where(EstadisticaPais.anio.in_([anio, anio_anterior]))
        .group_by(EstadisticaPais.anio, EstadisticaPais.mes)
    )
    for row in result.all():
        mes_idx = (row[0] or 1) - 1
        if 0 <= mes_idx < 12:
            pass

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


async def _build_rendimiento_profesores(db: AsyncSession, anio: int) -> RendimientoProfesores:
    result = await db.execute(
        select(
            Reporte.miembro_id,
            Miembro.nombre,
            func.count(Reporte.id).label("total_estudios"),
        )
        .join(Miembro, Reporte.miembro_id == Miembro.id)
        .where(extract("year", Reporte.fecha) == anio)
        .group_by(Reporte.miembro_id, Miembro.nombre)
        .order_by(func.count(Reporte.id).desc())
    )
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


async def _build_evangelismo_profesores(db: AsyncSession, anio: int) -> EvangelismoProfesores:
    result = await db.execute(
        select(
            Reporte.miembro_id,
            Miembro.nombre,
            func.sum(Reporte.tiempo_evangelizacion).label("total_horas"),
        )
        .join(Miembro, Reporte.miembro_id == Miembro.id)
        .where(extract("year", Reporte.fecha) == anio)
        .group_by(Reporte.miembro_id, Miembro.nombre)
        .order_by(func.sum(Reporte.tiempo_evangelizacion).desc())
    )
    profesores = []
    for row in result.all():
        horas = 0
        if row[2] is not None:
            td = row[2]
            horas = td.total_seconds() / 3600 if hasattr(td, "total_seconds") else float(td)
        profesores.append(ProfesorEvangelismo(
            id=row[0] or "", nombre=row[1] or "", total_horas=round(horas, 1)
        ))

    anios_result = await db.execute(
        select(func.distinct(extract("year", Reporte.fecha))).order_by(extract("year", Reporte.fecha).desc())
    )
    anios_disponibles = [int(a) for a in anios_result.scalars().all() if a is not None]

    return EvangelismoProfesores(
        profesores=profesores,
        modo="anual",
        anio=anio,
        anio_comparacion=anio - 1 if anio - 1 in anios_disponibles else None,
        anios_disponibles=anios_disponibles,
    )


async def _build_crecimiento_estudiantes(db: AsyncSession, anio: int) -> CrecimientoEstudiantes:
    serie = [0] * 12
    result = await db.execute(
        select(EstadisticaPais.mes, func.sum(EstadisticaPais.cantidad_estudios))
        .where(EstadisticaPais.anio == anio)
        .group_by(EstadisticaPais.mes)
    )
    for row in result.all():
        if row[0] and 1 <= row[0] <= 12:
            serie[row[0] - 1] = int(row[1] or 0)
    return CrecimientoEstudiantes(serie=serie, labels=MESES_LABELS, anio=anio)


async def _build_crecimiento_miembros(db: AsyncSession, anio: int) -> SeriesPorTipo:
    tipos = ["Todos", "Comprometido", "Registrado", "Voluntario"]
    series_por_tipo = {}

    anios_result = await db.execute(
        select(func.distinct(EstadisticaPais.anio)).order_by(EstadisticaPais.anio.desc())
    )
    anios_disponibles = [a for a in anios_result.scalars().all() if a is not None]

    result = await db.execute(
        select(EstadisticaPais.mes, func.sum(EstadisticaPais.cantidad_miembros))
        .where(EstadisticaPais.anio == anio)
        .group_by(EstadisticaPais.mes)
    )
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