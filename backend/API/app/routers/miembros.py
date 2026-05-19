from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Miembro, TipoMiembroEnum
from app.schemas import MiembroCreate, MiembroUpdate, MiembroOut

router = APIRouter(prefix="/miembros", tags=["Miembros"])


@router.get("/", response_model=list[MiembroOut])
async def listar(
    tipo: TipoMiembroEnum | None = Query(None, description="Filtrar por tipo de miembro"),
    pais_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Miembro).order_by(Miembro.nombre)
    if tipo:
        q = q.where(Miembro.tipo_miembro == tipo)
    if pais_id:
        q = q.where(Miembro.pais_id == pais_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=MiembroOut)
async def obtener(id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Miembro, id)
    if not obj:
        raise HTTPException(404, "Miembro no encontrado")
    return obj


@router.post("/", response_model=MiembroOut, status_code=201)
async def crear(data: MiembroCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(Miembro, data.id)
    if existing:
        raise HTTPException(400, f"Ya existe un miembro con id '{data.id}'")
    obj = Miembro(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=MiembroOut)
async def actualizar(id: str, data: MiembroUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Miembro, id)
    if not obj:
        raise HTTPException(404, "Miembro no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Miembro, id)
    if not obj:
        raise HTTPException(404, "Miembro no encontrado")
    await db.delete(obj)
