from datetime import datetime
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    Contacto,
    Entrevista,
    ExamenRomanos,
    Miembro,
    SeguimientoLey,
    SeguimientoLeyHistorial,
)
from app.schemas import (
    SeguimientoLeyAvance,
    SeguimientoLeyCreate,
    SeguimientoLeyHistorialOut,
    SeguimientoLeyOut,
    SeguimientoLeyUpdate,
)


router = APIRouter(prefix="/seguimiento-leyes", tags=["Seguimiento Leyes"])

ETAPAS = [
    "Contacto",
    "Termino Romanos 8",
    "Potencial",
    "Examen de Romanos",
    "Ley 1",
    "Ley 2",
    "Ley 3",
    "Ley 4",
    "Camino al Discipulo",
    "Entrevista",
    "Miembro",
]
ORDEN_ETAPAS = {etapa: index for index, etapa in enumerate(ETAPAS)}
DIAS_ALERTA_ABANDONO = 30
TIPOS_MIEMBRO_DESTINO = {
    "Comprometido": "Comprometido",
    "Registrado": "Registrado",
    "Compañerismo-Ministerio": "Voluntario",
    "Companerismo-Ministerio": "Voluntario",
    "Voluntario": "Voluntario",
}


def _slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9\s-]", "", value.lower())
    value = re.sub(r"[\s-]+", ".", value).strip(".")
    return value or "miembro"


async def _unique_miembro_id(db: AsyncSession, base_name: str) -> str:
    base_id = _slugify(base_name)
    candidate = base_id
    index = 2
    while await db.get(Miembro, candidate):
      candidate = f"{base_id}.{index}"
      index += 1
    return candidate


async def _crear_miembro_desde_contacto(
    db: AsyncSession,
    seguimiento: SeguimientoLey,
    contacto: Contacto,
) -> Miembro:
    if seguimiento.miembro_convertido_id:
        miembro = await db.get(Miembro, seguimiento.miembro_convertido_id)
        if miembro:
            return miembro

    miembro_id = await _unique_miembro_id(db, contacto.nombre or "miembro")
    tipo_destino = TIPOS_MIEMBRO_DESTINO.get(
        seguimiento.tipo_miembro_destino,
        seguimiento.tipo_miembro_destino if seguimiento.tipo_miembro_destino in {"Comprometido", "Registrado", "Voluntario"} else "Registrado",
    )

    miembro = Miembro(
        id=miembro_id,
        nombre=contacto.nombre,
        pais=contacto.pais,
        profesion=contacto.profesion,
        comentarios=seguimiento.notas_generales or contacto.notas,
        tipo_miembro=tipo_destino,
        pais_id=seguimiento.pais_id or contacto.pais_id,
        ciudad_id=contacto.ciudad_id,
        evangelizado_por=seguimiento.miembro_contacto_rel.nombre if seguimiento.miembro_contacto_rel else contacto.miembro_responsable,
    )
    db.add(miembro)
    await db.flush()
    await db.refresh(miembro)
    seguimiento.miembro_convertido_id = miembro.id
    seguimiento.fecha_conversion_miembro = datetime.utcnow()
    return miembro


def _dias_inactivo(fecha_ultimo_avance: datetime | None) -> int:
    if not fecha_ultimo_avance:
        return 0
    return max((datetime.utcnow() - fecha_ultimo_avance).days, 0)


def _serializar(historial: list[SeguimientoLeyHistorial]) -> list[SeguimientoLeyHistorialOut]:
    salida = []
    for item in historial:
        payload = {
            "id": item.id,
            "etapa": item.etapa,
            "etapa_orden": item.etapa_orden,
            "notas": item.notas,
            "maestro_id": item.maestro_id,
            "maestro_nombre": item.maestro_rel.nombre if item.maestro_rel else None,
            "calificacion_estrellas": item.calificacion_estrellas,
            "fecha_evento": item.fecha_evento,
        }
        salida.append(SeguimientoLeyHistorialOut.model_validate(payload))
    return salida


def _enriquecer(obj: SeguimientoLey) -> SeguimientoLeyOut:
    dias = _dias_inactivo(obj.fecha_ultimo_avance)
    abandono = obj.estado_actual != "Miembro" and dias >= DIAS_ALERTA_ABANDONO
    return SeguimientoLeyOut(
        id=obj.id,
        contacto_id=obj.contacto_id,
        pais_id=obj.pais_id,
        miembro_contacto_id=obj.miembro_contacto_id,
        miembro_estudios_id=obj.miembro_estudios_id,
        estado_actual=obj.estado_actual,
        etapa_actual_orden=obj.etapa_actual_orden,
        abandono_alerta=abandono or bool(obj.desertado),
        fecha_inicio=obj.fecha_inicio,
        fecha_ultimo_avance=obj.fecha_ultimo_avance,
        fecha_abandono=obj.fecha_abandono,
        fecha_desercion=obj.fecha_desercion,
        fecha_conversion_miembro=obj.fecha_conversion_miembro,
        miembro_convertido_id=obj.miembro_convertido_id,
        tipo_miembro_destino=obj.tipo_miembro_destino,
        notas_generales=obj.notas_generales,
        activo=obj.activo,
        desertado=bool(obj.desertado),
        contacto_nombre=obj.contacto_rel.nombre if obj.contacto_rel else None,
        contacto_telefono=obj.contacto_rel.telefono if obj.contacto_rel else None,
        pais_nombre=obj.pais_rel.nombre if obj.pais_rel else None,
        miembro_contacto_nombre=obj.miembro_contacto_rel.nombre if obj.miembro_contacto_rel else None,
        miembro_estudios_nombre=obj.miembro_estudios_rel.nombre if obj.miembro_estudios_rel else None,
        miembro_convertido_nombre=obj.miembro_convertido_rel.nombre if obj.miembro_convertido_rel else None,
        dias_inactivo=dias,
        historial=_serializar(obj.historial or []),
    )


async def _get_seguimiento(db: AsyncSession, seguimiento_id: int) -> SeguimientoLey:
    q = (
        select(SeguimientoLey)
        .options(
            selectinload(SeguimientoLey.contacto_rel),
            selectinload(SeguimientoLey.pais_rel),
            selectinload(SeguimientoLey.miembro_contacto_rel),
            selectinload(SeguimientoLey.miembro_estudios_rel),
            selectinload(SeguimientoLey.miembro_convertido_rel),
            selectinload(SeguimientoLey.historial).selectinload(SeguimientoLeyHistorial.maestro_rel),
        )
        .where(SeguimientoLey.id == seguimiento_id)
    )
    result = await db.execute(q)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Seguimiento no encontrado")
    return obj


@router.get("", response_model=list[SeguimientoLeyOut])
async def listar(
    pais_id: int | None = Query(None),
    estado: str | None = Query(None),
    solo_alertas: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(SeguimientoLey)
        .options(
            selectinload(SeguimientoLey.contacto_rel),
            selectinload(SeguimientoLey.pais_rel),
            selectinload(SeguimientoLey.miembro_contacto_rel),
            selectinload(SeguimientoLey.miembro_estudios_rel),
            selectinload(SeguimientoLey.miembro_convertido_rel),
            selectinload(SeguimientoLey.historial).selectinload(SeguimientoLeyHistorial.maestro_rel),
        )
        .order_by(SeguimientoLey.fecha_ultimo_avance.desc())
    )
    if pais_id:
        q = q.where(SeguimientoLey.pais_id == pais_id)
    if estado:
        q = q.where(SeguimientoLey.estado_actual == estado)

    result = await db.execute(q)
    items = result.scalars().all()
    enriched = [_enriquecer(item) for item in items]
    if solo_alertas:
        enriched = [item for item in enriched if item.abandono_alerta]
    return enriched


@router.get("/{seguimiento_id}", response_model=SeguimientoLeyOut)
async def obtener(seguimiento_id: int, db: AsyncSession = Depends(get_db)):
    return _enriquecer(await _get_seguimiento(db, seguimiento_id))


@router.post("", response_model=SeguimientoLeyOut, status_code=201)
async def crear(data: SeguimientoLeyCreate, db: AsyncSession = Depends(get_db)):
    contacto = await db.get(Contacto, data.contacto_id)
    if not contacto:
        raise HTTPException(404, "Contacto no encontrado")

    existing_query = await db.execute(
        select(SeguimientoLey).where(
            SeguimientoLey.contacto_id == data.contacto_id,
            SeguimientoLey.activo == True,  # noqa: E712
        )
    )
    existing = existing_query.scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Este contacto ya tiene un seguimiento activo")

    now = datetime.utcnow()
    obj = SeguimientoLey(
        contacto_id=data.contacto_id,
        pais_id=data.pais_id or contacto.pais_id,
        miembro_contacto_id=data.miembro_contacto_id,
        miembro_estudios_id=data.miembro_estudios_id,
        estado_actual=ETAPAS[0],
        etapa_actual_orden=0,
        fecha_inicio=now,
        fecha_ultimo_avance=now,
        tipo_miembro_destino=data.tipo_miembro_destino,
        notas_generales=data.notas_generales,
        activo=True,
    )
    db.add(obj)
    await db.flush()

    db.add(
        SeguimientoLeyHistorial(
            seguimiento_id=obj.id,
            etapa=ETAPAS[0],
            etapa_orden=0,
            notas="Inicio del seguimiento",
            fecha_evento=now,
        )
    )
    await db.flush()
    return _enriquecer(await _get_seguimiento(db, obj.id))


@router.patch("/{seguimiento_id}", response_model=SeguimientoLeyOut)
async def actualizar(seguimiento_id: int, data: SeguimientoLeyUpdate, db: AsyncSession = Depends(get_db)):
    obj = await _get_seguimiento(db, seguimiento_id)
    cambios = data.model_dump(exclude_unset=True)
    if "desertado" in cambios:
        obj.desertado = bool(cambios["desertado"])
        obj.fecha_desercion = datetime.utcnow() if obj.desertado else None
        obj.abandono_alerta = obj.desertado or obj.abandono_alerta
    for key, value in cambios.items():
        if key == "desertado":
            continue
        if key == "fecha_desercion":
            continue
        setattr(obj, key, value)
    await db.flush()
    return _enriquecer(await _get_seguimiento(db, seguimiento_id))


@router.post("/{seguimiento_id}/avanzar", response_model=SeguimientoLeyOut)
async def avanzar(seguimiento_id: int, data: SeguimientoLeyAvance, db: AsyncSession = Depends(get_db)):
    obj = await _get_seguimiento(db, seguimiento_id)
    etapa = data.etapa.strip()
    if etapa not in ORDEN_ETAPAS:
        raise HTTPException(400, "Etapa no valida")

    now = datetime.utcnow()
    obj.estado_actual = etapa
    obj.etapa_actual_orden = ORDEN_ETAPAS[etapa]
    obj.fecha_ultimo_avance = now
    obj.abandono_alerta = False
    obj.fecha_abandono = None
    obj.desertado = False
    obj.fecha_desercion = None

    db.add(
        SeguimientoLeyHistorial(
            seguimiento_id=obj.id,
            etapa=etapa,
            etapa_orden=obj.etapa_actual_orden,
            notas=data.notas,
            maestro_id=data.maestro_id,
            calificacion_estrellas=data.calificacion_estrellas,
            fecha_evento=now,
        )
    )

    if etapa == "Examen de Romanos":
        examen = obj.examen or ExamenRomanos(seguimiento_id=obj.id)
        examen.fecha = now.date()
        examen.nota_oral = data.nota_oral
        examen.nota_virtual = data.nota_virtual
        examen.nota = (
            ((data.nota_oral or 0) + (data.nota_virtual or 0)) / 2
            if data.nota_oral is not None or data.nota_virtual is not None
            else None
        )
        examen.evaluador_id = data.evaluador_id
        examen.aprobado = data.aprobado
        examen.observaciones = data.observaciones
        db.add(examen)

    if etapa == "Entrevista":
        entrevista = obj.entrevista or Entrevista(seguimiento_id=obj.id)
        entrevista.fecha = now.date()
        entrevista.entrevistador_id = data.entrevistador_id
        entrevista.resultado = data.resultado or "Pendiente"
        entrevista.tipo_miembro_resultante = data.tipo_miembro_resultante
        entrevista.observaciones = data.observaciones
        db.add(entrevista)

    if etapa == "Miembro":
        contacto = obj.contacto_rel or await db.get(Contacto, obj.contacto_id)
        await _crear_miembro_desde_contacto(db, obj, contacto)

    await db.flush()
    return _enriquecer(await _get_seguimiento(db, seguimiento_id))


@router.post("/{seguimiento_id}/retroceder", response_model=SeguimientoLeyOut)
async def retroceder(seguimiento_id: int, db: AsyncSession = Depends(get_db)):
    obj = await _get_seguimiento(db, seguimiento_id)

    if obj.etapa_actual_orden <= 0:
        raise HTTPException(400, "No se puede retroceder mas")

    etapa_actual = obj.estado_actual
    nueva_etapa = ETAPAS[obj.etapa_actual_orden - 1]
    ahora = datetime.utcnow()

    ultimo_historial = obj.historial[-1] if obj.historial else None
    if ultimo_historial and ultimo_historial.etapa == etapa_actual:
        await db.delete(ultimo_historial)

    obj.estado_actual = nueva_etapa
    obj.etapa_actual_orden = obj.etapa_actual_orden - 1
    obj.fecha_ultimo_avance = ahora
    obj.abandono_alerta = False
    obj.fecha_abandono = None

    if obj.miembro_convertido_id:
        obj.miembro_convertido_id = None
        obj.fecha_conversion_miembro = None

    await db.flush()
    return _enriquecer(await _get_seguimiento(db, seguimiento_id))


@router.get("/meta/etapas")
async def meta_etapas():
    return {"etapas": [{"nombre": etapa, "orden": ORDEN_ETAPAS[etapa]} for etapa in ETAPAS]}
