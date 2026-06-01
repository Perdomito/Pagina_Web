from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import CiudadMision
from app.schemas import CiudadMisionCreate, CiudadMisionUpdate, CiudadMisionOut

router = APIRouter(prefix="/ciudades-mision", tags=["Ciudades Mision"])


@router.get("/", response_model=list[CiudadMisionOut])
async def listar(
    ciudad_id: int | None = Query(None),
    estado_presencia: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(CiudadMision).order_by(CiudadMision.fecha_creacion.desc())
    if ciudad_id:
        q = q.where(CiudadMision.ciudad_id == ciudad_id)
    if estado_presencia:
        q = q.where(CiudadMision.estado_presencia == estado_presencia)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=CiudadMisionOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(CiudadMision, id)
    if not obj:
        raise HTTPException(404, "Ciudad mision no encontrada")
    return obj


@router.post("/", response_model=CiudadMisionOut, status_code=201)
async def crear(data: CiudadMisionCreate, db: AsyncSession = Depends(get_db)):
    obj = CiudadMision(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=CiudadMisionOut)
async def actualizar(id: int, data: CiudadMisionUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(CiudadMision, id)
    if not obj:
        raise HTTPException(404, "Ciudad mision no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(CiudadMision, id)
    if not obj:
        raise HTTPException(404, "Ciudad mision no encontrada")
    await db.delete(obj)