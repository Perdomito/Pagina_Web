from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Reporte
from app.schemas import ReporteCreate, ReporteUpdate, ReporteOut

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("", response_model=list[ReporteOut])
async def listar(
    miembro_id: str | None = Query(None),
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Reporte).order_by(Reporte.fecha.desc())
    if miembro_id:
        q = q.where(Reporte.miembro_id == miembro_id)
    if pais_id:
        q = q.where(Reporte.pais_id == pais_id)
    if anio:
        q = q.where(Reporte.fecha >= f"{anio}-01-01").where(Reporte.fecha <= f"{anio}-12-31")
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=ReporteOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Reporte, id)
    if not obj:
        raise HTTPException(404, "Reporte no encontrado")
    return obj


@router.post("", response_model=ReporteOut, status_code=201)
async def crear(data: ReporteCreate, db: AsyncSession = Depends(get_db)):
    obj = Reporte(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=ReporteOut)
async def actualizar(id: int, data: ReporteUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Reporte, id)
    if not obj:
        raise HTTPException(404, "Reporte no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Reporte, id)
    if not obj:
        raise HTTPException(404, "Reporte no encontrado")
    await db.delete(obj)
