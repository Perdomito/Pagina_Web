from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import GastoReal
from app.schemas import GastoRealCreate, GastoRealUpdate, GastoRealOut

router = APIRouter(prefix="/gastos-reales", tags=["Gastos Reales"])


@router.get("/", response_model=list[GastoRealOut])
async def listar(
    ejecucion_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(GastoReal).order_by(GastoReal.fecha_creacion.desc())
    if ejecucion_id:
        q = q.where(GastoReal.ejecucion_id == ejecucion_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=GastoRealOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(GastoReal, id)
    if not obj:
        raise HTTPException(404, "Gasto no encontrado")
    return obj


@router.post("/", response_model=GastoRealOut, status_code=201)
async def crear(data: GastoRealCreate, db: AsyncSession = Depends(get_db)):
    obj = GastoReal(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=GastoRealOut)
async def actualizar(id: int, data: GastoRealUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(GastoReal, id)
    if not obj:
        raise HTTPException(404, "Gasto no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(GastoReal, id)
    if not obj:
        raise HTTPException(404, "Gasto no encontrado")
    await db.delete(obj)
