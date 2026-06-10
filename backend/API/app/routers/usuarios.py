import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioUpdate, UsuarioOut

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


@router.get("", response_model=list[UsuarioOut])
async def listar(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).order_by(Usuario.nombre))
    return result.scalars().all()


@router.get("/{id}", response_model=UsuarioOut)
async def obtener(id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Usuario, id)
    if not obj:
        raise HTTPException(404, "Usuario no encontrado")
    return obj


@router.post("", response_model=UsuarioOut, status_code=201)
async def crear(data: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(Usuario, data.id)
    if existing:
        raise HTTPException(400, f"Ya existe un usuario con id '{data.id}'")
    obj = Usuario(**data.model_dump(exclude={"password"}), password_hash=_hash_password(data.password))
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=UsuarioOut)
async def actualizar(id: str, data: UsuarioUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Usuario, id)
    if not obj:
        raise HTTPException(404, "Usuario no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = _hash_password(update_data.pop("password"))
    for k, v in update_data.items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Usuario, id)
    if not obj:
        raise HTTPException(404, "Usuario no encontrado")
    await db.delete(obj)
