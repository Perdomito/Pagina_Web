from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Ciudad, Iglesia, Pais, Miembro
from app.schemas import IglesiaCreate, IglesiaUpdate, IglesiaOut

router = APIRouter(prefix="/iglesias", tags=["Iglesias"])


async def _conteo_miembros_por_iglesia(db: AsyncSession, iglesia_ids: list[int]) -> dict[int, int]:
    """Cuenta miembros reales (Miembro.iglesia_id) por iglesia, no el campo manual viejo."""
    if not iglesia_ids:
        return {}
    q = (
        select(Miembro.iglesia_id, func.count(Miembro.id))
        .where(Miembro.iglesia_id.in_(iglesia_ids))
        .group_by(Miembro.iglesia_id)
    )
    result = await db.execute(q)
    return {iglesia_id: int(cantidad) for iglesia_id, cantidad in result.all()}


def _enrich_iglesia(obj: Iglesia, conteo_real: int | None = None) -> dict:
    return {
        "id": obj.id,
        "ciudad_id": obj.ciudad_id,
        "pais_id": obj.pais_id,
        "nombre": obj.nombre,
        "direccion": obj.direccion,
        "pastor_encargado_id": obj.pastor_encargado_id,
        "pastor_encargado_nombre": obj.pastor_encargado_nombre,
        "fecha_apertura": obj.fecha_apertura,
        "cantidad_miembros": conteo_real if conteo_real is not None else 0,
        "activa": obj.activa,
        "notas": obj.notas,
        "fecha_creacion": obj.fecha_creacion,
        "fecha_actualizacion": obj.fecha_actualizacion,
        "ciudad_nombre": obj.ciudad_rel.nombre if obj.ciudad_rel else None,
        "pais_nombre": obj.pais_rel.nombre if obj.pais_rel else None,
    }


async def _resolver_pais(data: dict, db: AsyncSession) -> None:
    """Completa pais_id desde la ciudad cuando el cliente no lo manda."""
    if data.get("pais_id") is not None or data.get("ciudad_id") is None:
        return
    ciudad = await db.get(Ciudad, data["ciudad_id"])
    if ciudad and ciudad.pais_iso2:
        pais_id = (
            await db.execute(select(Pais.id).where(Pais.iso == ciudad.pais_iso2))
        ).scalar_one_or_none()
        if pais_id:
            data["pais_id"] = pais_id


@router.get("", response_model=list[IglesiaOut])
async def listar(
    pais_id: int | None = Query(None),
    ciudad_id: int | None = Query(None),
    activa: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Iglesia)
        .options(selectinload(Iglesia.ciudad_rel), selectinload(Iglesia.pais_rel))
        .order_by(Iglesia.nombre)
    )
    if pais_id:
        q = q.where(Iglesia.pais_id == pais_id)
    if ciudad_id:
        q = q.where(Iglesia.ciudad_id == ciudad_id)
    if activa is not None:
        q = q.where(Iglesia.activa == activa)
    result = await db.execute(q)
    iglesias = result.scalars().all()
    conteos = await _conteo_miembros_por_iglesia(db, [i.id for i in iglesias])
    return [IglesiaOut.model_validate(_enrich_iglesia(i, conteos.get(i.id, 0))) for i in iglesias]


@router.get("/conteo-por-pais")
async def conteo_por_pais(
    activa: bool | None = Query(True, description="Contar solo iglesias activas"),
    db: AsyncSession = Depends(get_db),
):
    """Cantidad de iglesias por pais, para las tarjetas de Estadisticas."""
    q = select(Iglesia.pais_id, func.count(Iglesia.id)).group_by(Iglesia.pais_id)
    if activa is not None:
        q = q.where(Iglesia.activa == activa)
    result = await db.execute(q)
    return [
        {"pais_id": pais_id, "cantidad": int(cantidad)}
        for pais_id, cantidad in result.all()
        if pais_id is not None
    ]


@router.get("/{id}", response_model=IglesiaOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    q = (
        select(Iglesia)
        .options(selectinload(Iglesia.ciudad_rel), selectinload(Iglesia.pais_rel))
        .where(Iglesia.id == id)
    )
    obj = (await db.execute(q)).scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Iglesia no encontrada")
    conteo = await _conteo_miembros_por_iglesia(db, [obj.id])
    return IglesiaOut.model_validate(_enrich_iglesia(obj, conteo.get(obj.id, 0)))


@router.post("", response_model=IglesiaOut, status_code=201)
async def crear(data: IglesiaCreate, db: AsyncSession = Depends(get_db)):
    valores = data.model_dump()
    if not (valores.get("nombre") or "").strip():
        raise HTTPException(422, "El nombre de la iglesia es obligatorio")
    if not await db.get(Ciudad, valores["ciudad_id"]):
        raise HTTPException(404, "Ciudad no encontrada")
    await _resolver_pais(valores, db)

    obj = Iglesia(**valores)
    db.add(obj)
    await db.flush()
    return await obtener(obj.id, db)


@router.patch("/{id}", response_model=IglesiaOut)
async def actualizar(id: int, data: IglesiaUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Iglesia, id)
    if not obj:
        raise HTTPException(404, "Iglesia no encontrada")
    valores = data.model_dump(exclude_unset=True)
    if "ciudad_id" in valores:
        if not await db.get(Ciudad, valores["ciudad_id"]):
            raise HTTPException(404, "Ciudad no encontrada")
        valores.setdefault("pais_id", None)
        await _resolver_pais(valores, db)
    for k, v in valores.items():
        setattr(obj, k, v)
    await db.flush()
    return await obtener(id, db)


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Iglesia, id)
    if not obj:
        raise HTTPException(404, "Iglesia no encontrada")
    await db.delete(obj)
