from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Contacto
from app.schemas import ContactoCreate, ContactoUpdate, ContactoOut

router = APIRouter(prefix="/contactos", tags=["Contactos"])


@router.get("/", response_model=list[ContactoOut])
async def listar(
    miembro_responsable_id: str | None = Query(None),
    pais_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Contacto).order_by(Contacto.nombre)
    if miembro_responsable_id:
        q = q.where(Contacto.miembro_responsable_id == miembro_responsable_id)
    if pais_id:
        q = q.where(Contacto.pais_id == pais_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=ContactoOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Contacto, id)
    if not obj:
        raise HTTPException(404, "Contacto no encontrado")
    return obj


@router.post("/", response_model=ContactoOut, status_code=201)
async def crear(data: ContactoCreate, db: AsyncSession = Depends(get_db)):
    obj = Contacto(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=ContactoOut)
async def actualizar(id: int, data: ContactoUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Contacto, id)
    if not obj:
        raise HTTPException(404, "Contacto no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Contacto, id)
    if not obj:
        raise HTTPException(404, "Contacto no encontrado")
    await db.delete(obj)
