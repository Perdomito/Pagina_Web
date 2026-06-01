from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Ingreso
from app.schemas import IngresoCreate, IngresoUpdate, IngresoOut

router = APIRouter(prefix="/ingresos", tags=["Ingresos"])


@router.get("/", response_model=list[IngresoOut])
async def listar(
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    mes: int | None = Query(None),
    tipo: str | None = Query(None),
    donde_ingresa: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Ingreso).order_by(Ingreso.anio.desc(), Ingreso.mes.desc())
    if pais_id:
        q = q.where(Ingreso.pais_id == pais_id)
    if anio:
        q = q.where(Ingreso.anio == anio)
    if mes:
        q = q.where(Ingreso.mes == mes)
    if tipo:
        q = q.where(Ingreso.tipo == tipo)
    if donde_ingresa:
        q = q.where(Ingreso.donde_ingresa == donde_ingresa)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=IngresoOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ingreso, id)
    if not obj:
        raise HTTPException(404, "Ingreso no encontrado")
    return obj


@router.post("/", response_model=IngresoOut, status_code=201)
async def crear(data: IngresoCreate, db: AsyncSession = Depends(get_db)):
    obj = Ingreso(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=IngresoOut)
async def actualizar(id: int, data: IngresoUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ingreso, id)
    if not obj:
        raise HTTPException(404, "Ingreso no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ingreso, id)
    if not obj:
        raise HTTPException(404, "Ingreso no encontrado")
    await db.delete(obj)