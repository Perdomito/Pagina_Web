from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import MiembroInfoAdicional
from app.schemas import MiembroInfoAdicionalCreate, MiembroInfoAdicionalUpdate, MiembroInfoAdicionalOut

router = APIRouter(prefix="/miembros-info-adicional", tags=["Miembros Info Adicional"])


@router.get("", response_model=list[MiembroInfoAdicionalOut])
async def listar(
    miembro_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(MiembroInfoAdicional)
    if miembro_id:
        q = q.where(MiembroInfoAdicional.miembro_id == miembro_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{miembro_id}", response_model=MiembroInfoAdicionalOut)
async def obtener(miembro_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(MiembroInfoAdicional, miembro_id)
    if not obj:
        raise HTTPException(404, "Info adicional del miembro no encontrada")
    return obj


@router.post("", response_model=MiembroInfoAdicionalOut, status_code=201)
async def crear(data: MiembroInfoAdicionalCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(MiembroInfoAdicional, data.miembro_id)
    if existing:
        raise HTTPException(400, "Ya existe info adicional para ese miembro")
    obj = MiembroInfoAdicional(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{miembro_id}", response_model=MiembroInfoAdicionalOut)
async def actualizar(miembro_id: str, data: MiembroInfoAdicionalUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(MiembroInfoAdicional, miembro_id)
    if not obj:
        raise HTTPException(404, "Info adicional del miembro no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{miembro_id}", status_code=204)
async def eliminar(miembro_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(MiembroInfoAdicional, miembro_id)
    if not obj:
        raise HTTPException(404, "Info adicional del miembro no encontrada")
    await db.delete(obj)