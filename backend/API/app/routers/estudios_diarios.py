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
    # El id al final deja el orden determinista: la UI se queda con la ultima
    # fila de cada dia, que es la version mas reciente de los contadores.
    q = select(EstudioDiario).order_by(
        EstudioDiario.anio.desc(), EstudioDiario.mes.desc(), EstudioDiario.dia.desc(), EstudioDiario.id
    )
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
    # Los contadores diarios (dijeron si / nuevos contactos / potenciales) no
    # llevan contacto ni tipo y la UI los reenvia en cada tecla: sin este
    # upsert quedaba una fila por pulsacion y los reportes sumaban de mas.
    if data.contacto_id is None and data.tipo is None:
        existente = (
            await db.execute(
                select(EstudioDiario)
                .where(
                    EstudioDiario.miembro_id == data.miembro_id,
                    EstudioDiario.anio == data.anio,
                    EstudioDiario.mes == data.mes,
                    EstudioDiario.dia == data.dia,
                    EstudioDiario.contacto_id.is_(None),
                    EstudioDiario.tipo.is_(None),
                )
                .order_by(EstudioDiario.id.desc())
            )
        ).scalars().first()
        if existente:
            for k, v in data.model_dump().items():
                setattr(existente, k, v)
            await db.flush()
            await db.refresh(existente)
            return existente

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