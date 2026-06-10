from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Traslado
from app.schemas import TrasladoCreate, TrasladoUpdate, TrasladoOut

router = APIRouter(prefix="/traslados", tags=["Traslados"])


@router.get("", response_model=list[TrasladoOut])
async def listar(
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    mes: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Traslado).order_by(Traslado.fecha.desc())
    if pais_id:
        q = q.where(Traslado.pais_id == pais_id)
    if anio or mes:
        from sqlalchemy import extract
        if anio:
            q = q.where(extract("year", Traslado.fecha) == anio)
        if mes:
            q = q.where(extract("month", Traslado.fecha) == mes)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=TrasladoOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Traslado, id)
    if not obj:
        raise HTTPException(404, "Traslado no encontrado")
    return obj


@router.post("", response_model=TrasladoOut, status_code=201)
async def crear(data: TrasladoCreate, db: AsyncSession = Depends(get_db)):
    obj = Traslado(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=TrasladoOut)
async def actualizar(id: int, data: TrasladoUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Traslado, id)
    if not obj:
        raise HTTPException(404, "Traslado no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Traslado, id)
    if not obj:
        raise HTTPException(404, "Traslado no encontrado")
    await db.delete(obj)