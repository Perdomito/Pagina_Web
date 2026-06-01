from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Continente
from app.schemas import ContinenteCreate, ContinenteUpdate, ContinenteOut

router = APIRouter(prefix="/continentes", tags=["Continentes"])


@router.get("/", response_model=list[ContinenteOut])
async def listar(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Continente).order_by(Continente.nombre))
    return result.scalars().all()


@router.get("/{id}", response_model=ContinenteOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Continente, id)
    if not obj:
        raise HTTPException(404, "Continente no encontrado")
    return obj


@router.post("/", response_model=ContinenteOut, status_code=201)
async def crear(data: ContinenteCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Continente).where(Continente.nombre == data.nombre)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Ya existe un continente con ese nombre")
    obj = Continente(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=ContinenteOut)
async def actualizar(id: int, data: ContinenteUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Continente, id)
    if not obj:
        raise HTTPException(404, "Continente no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Continente, id)
    if not obj:
        raise HTTPException(404, "Continente no encontrado")
    await db.delete(obj)