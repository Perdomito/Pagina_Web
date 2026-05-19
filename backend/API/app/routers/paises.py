from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Pais
from app.schemas import PaisCreate, PaisUpdate, PaisOut

router = APIRouter(prefix="/paises", tags=["Países"])


@router.get("/", response_model=list[PaisOut])
async def listar(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Pais).order_by(Pais.nombre))
    return result.scalars().all()


@router.get("/{id}", response_model=PaisOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Pais, id)
    if not obj:
        raise HTTPException(404, "País no encontrado")
    return obj


@router.post("/", response_model=PaisOut, status_code=201)
async def crear(data: PaisCreate, db: AsyncSession = Depends(get_db)):
    obj = Pais(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=PaisOut)
async def actualizar(id: int, data: PaisUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Pais, id)
    if not obj:
        raise HTTPException(404, "País no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Pais, id)
    if not obj:
        raise HTTPException(404, "País no encontrado")
    await db.delete(obj)
