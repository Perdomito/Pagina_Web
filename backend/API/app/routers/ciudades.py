from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Ciudad
from app.schemas import CiudadCreate, CiudadUpdate, CiudadOut

router = APIRouter(prefix="/ciudades", tags=["Ciudades"])


@router.get("/", response_model=list[CiudadOut])
async def listar(
    pais_iso2: str | None = Query(None, description="Filtrar por código ISO del país"),
    limit: int = Query(50, le=500),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    q = select(Ciudad).order_by(Ciudad.nombre).limit(limit).offset(offset)
    if pais_iso2:
        q = q.where(Ciudad.pais_iso2 == pais_iso2)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=CiudadOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ciudad, id)
    if not obj:
        raise HTTPException(404, "Ciudad no encontrada")
    return obj


@router.post("/", response_model=CiudadOut, status_code=201)
async def crear(data: CiudadCreate, db: AsyncSession = Depends(get_db)):
    obj = Ciudad(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=CiudadOut)
async def actualizar(id: int, data: CiudadUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ciudad, id)
    if not obj:
        raise HTTPException(404, "Ciudad no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ciudad, id)
    if not obj:
        raise HTTPException(404, "Ciudad no encontrada")
    await db.delete(obj)
