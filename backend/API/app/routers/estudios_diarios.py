from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import EstudioDiario
from app.schemas import EstudioDiarioCreate, EstudioDiarioUpdate, EstudioDiarioOut

router = APIRouter(prefix="/estudios-diarios", tags=["Estudios Diarios"])


@router.get("", response_model=list[EstudioDiarioOut])
async def listar(
    miembro_id: str | None = Query(None),
    pais_id: int | None = Query(None),
    anio: int | None = Query(None),
    mes: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(EstudioDiario).order_by(EstudioDiario.anio.desc(), EstudioDiario.mes.desc(), EstudioDiario.dia.desc())
    if miembro_id:
        q = q.where(EstudioDiario.miembro_id == miembro_id)
    if pais_id:
        q = q.where(EstudioDiario.pais_id == pais_id)
    if anio:
        q = q.where(EstudioDiario.anio == anio)
    if mes:
        q = q.where(EstudioDiario.mes == mes)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=EstudioDiarioOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(EstudioDiario, id)
    if not obj:
        raise HTTPException(404, "Estudio diario no encontrado")
    return obj


@router.post("", response_model=EstudioDiarioOut, status_code=201)
async def crear(data: EstudioDiarioCreate, db: AsyncSession = Depends(get_db)):
    obj = EstudioDiario(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=EstudioDiarioOut)
async def actualizar(id: int, data: EstudioDiarioUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(EstudioDiario, id)
    if not obj:
        raise HTTPException(404, "Estudio diario no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(EstudioDiario, id)
    if not obj:
        raise HTTPException(404, "Estudio diario no encontrado")
    await db.delete(obj)