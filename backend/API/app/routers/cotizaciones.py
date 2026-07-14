from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Cotizacion, CotizacionEstadoEnum
from app.schemas import CotizacionCreate, CotizacionUpdate, CotizacionOut

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones"])


@router.get("", response_model=list[CotizacionOut])
async def listar(
    estado: CotizacionEstadoEnum | None = Query(None),
    miembro_id: str | None = Query(None),
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    mes: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Cotizacion).order_by(Cotizacion.fecha.desc())
    if estado:
        q = q.where(Cotizacion.estado == estado)
    if miembro_id:
        q = q.where(Cotizacion.miembro_id == miembro_id)
    if pais_id:
        q = q.where(Cotizacion.pais_id == pais_id)
    if anio:
        q = q.where(Cotizacion.anio_agregado == anio)
    if mes:
        q = q.where(Cotizacion.mes_agregado == mes)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=CotizacionOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Cotizacion, id)
    if not obj:
        raise HTTPException(404, "Cotización no encontrada")
    return obj


@router.post("", response_model=CotizacionOut, status_code=201)
async def crear(data: CotizacionCreate, db: AsyncSession = Depends(get_db)):
    obj = Cotizacion(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=CotizacionOut)
async def actualizar(id: int, data: CotizacionUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Cotizacion, id)
    if not obj:
        raise HTTPException(404, "Cotización no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Cotizacion, id)
    if not obj:
        raise HTTPException(404, "Cotización no encontrada")
    await db.delete(obj)
