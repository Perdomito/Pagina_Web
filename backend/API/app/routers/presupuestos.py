from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Presupuesto
from app.schemas import PresupuestoCreate, PresupuestoUpdate, PresupuestoOut

router = APIRouter(prefix="/presupuestos", tags=["Presupuestos"])


@router.get("", response_model=list[PresupuestoOut])
async def listar(
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    mes: int | None = Query(None),
    tipo_gasto: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Presupuesto).order_by(Presupuesto.anio.desc(), Presupuesto.mes.desc())
    if pais_id:
        q = q.where(Presupuesto.pais_id == pais_id)
    if anio:
        q = q.where(Presupuesto.anio == anio)
    if mes:
        q = q.where(Presupuesto.mes == mes)
    if tipo_gasto:
        q = q.where(Presupuesto.tipo_gasto == tipo_gasto)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=PresupuestoOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Presupuesto, id)
    if not obj:
        raise HTTPException(404, "Presupuesto no encontrado")
    return obj


@router.post("", response_model=PresupuestoOut, status_code=201)
async def crear(data: PresupuestoCreate, db: AsyncSession = Depends(get_db)):
    obj = Presupuesto(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=PresupuestoOut)
async def actualizar(id: int, data: PresupuestoUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Presupuesto, id)
    if not obj:
        raise HTTPException(404, "Presupuesto no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Presupuesto, id)
    if not obj:
        raise HTTPException(404, "Presupuesto no encontrado")
    await db.delete(obj)
