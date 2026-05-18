from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Ejecucion
from app.schemas import EjecucionCreate, EjecucionUpdate, EjecucionOut

router = APIRouter(prefix="/ejecuciones", tags=["Ejecuciones"])


@router.get("/", response_model=list[EjecucionOut])
async def listar(
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    mes: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Ejecucion).order_by(Ejecucion.anio.desc(), Ejecucion.mes.desc())
    if pais_id:
        q = q.where(Ejecucion.pais_id == pais_id)
    if anio:
        q = q.where(Ejecucion.anio == anio)
    if mes:
        q = q.where(Ejecucion.mes == mes)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=EjecucionOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ejecucion, id)
    if not obj:
        raise HTTPException(404, "Ejecución no encontrada")
    return obj


@router.post("/", response_model=EjecucionOut, status_code=201)
async def crear(data: EjecucionCreate, db: AsyncSession = Depends(get_db)):
    obj = Ejecucion(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=EjecucionOut)
async def actualizar(id: int, data: EjecucionUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ejecucion, id)
    if not obj:
        raise HTTPException(404, "Ejecución no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Ejecucion, id)
    if not obj:
        raise HTTPException(404, "Ejecución no encontrada")
    await db.delete(obj)
