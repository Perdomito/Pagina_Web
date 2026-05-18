from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Configuracion
from app.schemas import ConfiguracionCreate, ConfiguracionUpdate, ConfiguracionOut

router = APIRouter(prefix="/configuracion", tags=["Configuración"])


@router.get("/", response_model=list[ConfiguracionOut])
async def listar(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Configuracion).order_by(Configuracion.clave))
    return result.scalars().all()


@router.get("/{clave}", response_model=ConfiguracionOut)
async def obtener_por_clave(clave: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Configuracion).where(Configuracion.clave == clave))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, f"Clave '{clave}' no encontrada")
    return obj


@router.post("/", response_model=ConfiguracionOut, status_code=201)
async def crear(data: ConfiguracionCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Configuracion).where(Configuracion.clave == data.clave))
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"La clave '{data.clave}' ya existe")
    obj = Configuracion(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{clave}", response_model=ConfiguracionOut)
async def actualizar(clave: str, data: ConfiguracionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Configuracion).where(Configuracion.clave == clave))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, f"Clave '{clave}' no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{clave}", status_code=204)
async def eliminar(clave: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Configuracion).where(Configuracion.clave == clave))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, f"Clave '{clave}' no encontrada")
    await db.delete(obj)
