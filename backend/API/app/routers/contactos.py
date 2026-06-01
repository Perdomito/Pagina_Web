from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Contacto, Pais
from app.schemas import ContactoCreate, ContactoUpdate, ContactoOut

router = APIRouter(prefix="/contactos", tags=["Contactos"])


def _enrich_contacto(obj: Contacto) -> dict:
    data = {
        "id": obj.id,
        "miembro_responsable": obj.miembro_responsable,
        "nombre": obj.nombre,
        "telefono": obj.telefono,
        "pais": obj.pais,
        "notas": obj.notas,
        "profesion": obj.profesion,
        "pais_id": obj.pais_id,
        "miembro_responsable_id": obj.miembro_responsable_id,
        "ciudad_id": obj.ciudad_id,
        "fecha_creacion": obj.fecha_creacion,
        "pais_nombre": obj.pais_rel.nombre if obj.pais_rel else None,
    }
    return data


@router.get("/", response_model=list[ContactoOut])
async def listar(
    miembro_responsable_id: str | None = Query(None),
    pais_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Contacto).options(selectinload(Contacto.pais_rel)).order_by(Contacto.nombre)
    if miembro_responsable_id:
        q = q.where(Contacto.miembro_responsable_id == miembro_responsable_id)
    if pais_id:
        q = q.where(Contacto.pais_id == pais_id)
    result = await db.execute(q)
    contactos = result.scalars().all()
    return [ContactoOut.model_validate(_enrich_contacto(c)) for c in contactos]


@router.get("/{id}", response_model=ContactoOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    q = select(Contacto).options(selectinload(Contacto.pais_rel)).where(Contacto.id == id)
    result = await db.execute(q)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Contacto no encontrado")
    return ContactoOut.model_validate(_enrich_contacto(obj))


@router.post("/", response_model=ContactoOut, status_code=201)
async def crear(data: ContactoCreate, db: AsyncSession = Depends(get_db)):
    obj = Contacto(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    if obj.pais_id:
        pais = await db.get(Pais, obj.pais_id)
        obj.pais_rel = pais
    return ContactoOut.model_validate(_enrich_contacto(obj))


@router.patch("/{id}", response_model=ContactoOut)
async def actualizar(id: int, data: ContactoUpdate, db: AsyncSession = Depends(get_db)):
    q = select(Contacto).options(selectinload(Contacto.pais_rel)).where(Contacto.id == id)
    result = await db.execute(q)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Contacto no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    if obj.pais_id:
        pais = await db.get(Pais, obj.pais_id)
        obj.pais_rel = pais
    return ContactoOut.model_validate(_enrich_contacto(obj))


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Contacto, id)
    if not obj:
        raise HTTPException(404, "Contacto no encontrado")
    await db.delete(obj)
