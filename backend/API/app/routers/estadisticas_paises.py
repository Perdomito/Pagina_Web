from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import EstadisticaPais
from app.schemas import EstadisticaPaisCreate, EstadisticaPaisUpdate, EstadisticaPaisOut

router = APIRouter(prefix="/estadisticas-paises", tags=["Estadísticas por País"])


@router.get("/", response_model=list[EstadisticaPaisOut])
async def listar(
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    mes: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(EstadisticaPais).order_by(EstadisticaPais.anio.desc(), EstadisticaPais.mes.desc())
    if pais_id:
        q = q.where(EstadisticaPais.pais_id == pais_id)
    if anio:
        q = q.where(EstadisticaPais.anio == anio)
    if mes:
        q = q.where(EstadisticaPais.mes == mes)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=EstadisticaPaisOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(EstadisticaPais, id)
    if not obj:
        raise HTTPException(404, "Estadística no encontrada")
    return obj


@router.post("/", response_model=EstadisticaPaisOut, status_code=201)
async def crear(data: EstadisticaPaisCreate, db: AsyncSession = Depends(get_db)):
    obj = EstadisticaPais(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=EstadisticaPaisOut)
async def actualizar(id: int, data: EstadisticaPaisUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(EstadisticaPais, id)
    if not obj:
        raise HTTPException(404, "Estadística no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(EstadisticaPais, id)
    if not obj:
        raise HTTPException(404, "Estadística no encontrada")
    await db.delete(obj)
