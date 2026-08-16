import re

import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Usuario, UsuarioPermiso, Auditoria
from app.schemas import (
    UsuarioCreate, UsuarioUpdate, UsuarioOut,
    UsuarioPermisoCreate, UsuarioPermisoUpdate, UsuarioPermisoOut,
)
from app.auth_middleware import get_current_user

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

_ID_USUARIO = re.compile(r"U\d+")


def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


async def _generar_usuario_id(db: AsyncSession) -> str:
    result = await db.execute(select(Usuario.id).where(Usuario.id.like("U%")))
    numeros = [int(uid[1:]) for uid in result.scalars() if _ID_USUARIO.fullmatch(uid)]
    return f"U{max(numeros, default=0) + 1:03d}"


def _registrar(db: AsyncSession, actor: Usuario, accion: str, descripcion: str):
    db.add(
        Auditoria(
            usuario_id=actor.id,
            usuario_nombre=actor.nombre,
            modulo="usuarios",
            accion=accion,
            descripcion=descripcion,
        )
    )


@router.get("", response_model=list[UsuarioOut])
async def listar(
    pais_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Usuario).order_by(Usuario.nombre)
    if pais_id:
        q = q.where(Usuario.pais_id == pais_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=UsuarioOut)
async def obtener(id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Usuario, id)
    if not obj:
        raise HTTPException(404, "Usuario no encontrado")
    return obj


@router.post("", response_model=UsuarioOut, status_code=201)
async def crear(
    data: UsuarioCreate,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rol = data.rol if data.rol is not None else data.rol_id
    if rol is None:
        raise HTTPException(422, "Se requiere 'rol' o 'rol_id'")
    if data.id:
        if await db.get(Usuario, data.id):
            raise HTTPException(400, f"Ya existe un usuario con id '{data.id}'")
        usuario_id = data.id
    else:
        usuario_id = await _generar_usuario_id(db)
    existing_email = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe un usuario con email '{data.email}'")
    campos = data.model_dump(exclude={"id", "password", "rol", "rol_id"})
    obj = Usuario(id=usuario_id, rol=rol, password_hash=_hash_password(data.password), **campos)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)

    _registrar(db, actor, "crear", f"Creó al usuario {obj.nombre} ({obj.email})")
    await db.flush()
    return obj


@router.patch("/{id}", response_model=UsuarioOut)
async def actualizar(
    id: str,
    data: UsuarioUpdate,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Usuario, id)
    if not obj:
        raise HTTPException(404, "Usuario no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    password = update_data.pop("password", None)
    cambio_password = bool(password)
    if password:
        update_data["password_hash"] = _hash_password(password)
    rol_id = update_data.pop("rol_id", None)
    if rol_id is not None and "rol" not in update_data:
        update_data["rol"] = rol_id
    for k, v in update_data.items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)

    detalle = "Cambió la contraseña" if cambio_password else "Editó sus datos"
    _registrar(db, actor, "editar", f"{detalle} de {obj.nombre} ({obj.email})")
    await db.flush()
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(
    id: str,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Usuario, id)
    if not obj:
        raise HTTPException(404, "Usuario no encontrado")
    nombre, email = obj.nombre, obj.email
    await db.delete(obj)
    _registrar(db, actor, "eliminar", f"Eliminó al usuario {nombre} ({email})")
    await db.flush()


@router.get("/{usuario_id}/permisos", response_model=list[UsuarioPermisoOut])
async def listar_permisos_usuario(usuario_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UsuarioPermiso).where(UsuarioPermiso.usuario_id == usuario_id)
    )
    return result.scalars().all()


@router.post("/{usuario_id}/permisos", response_model=UsuarioPermisoOut, status_code=201)
async def agregar_permiso_usuario(
    usuario_id: str, data: UsuarioPermisoCreate,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    usuario = await db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")
    existing = await db.execute(
        select(UsuarioPermiso).where(
            UsuarioPermiso.usuario_id == usuario_id,
            UsuarioPermiso.permiso_id == data.permiso_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "El usuario ya tiene ese permiso")
    obj = UsuarioPermiso(
        usuario_id=usuario_id,
        permiso_id=data.permiso_id,
        tiene_acceso=data.tiene_acceso,
    )
    db.add(obj)
    await db.flush()
    await db.refresh(obj)

    _registrar(db, actor, "editar", f"Personalizó el permiso {data.permiso_id} de {usuario.nombre}")
    await db.flush()
    return obj


@router.patch("/{usuario_id}/permisos/{permiso_id}", response_model=UsuarioPermisoOut)
async def actualizar_permiso_usuario(
    usuario_id: str, permiso_id: int,
    data: UsuarioPermisoUpdate,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UsuarioPermiso).where(
            UsuarioPermiso.usuario_id == usuario_id,
            UsuarioPermiso.permiso_id == permiso_id,
        )
    )
    obj = result.scalar_one_or_none()
    valores = data.model_dump(exclude_unset=True)
    usuario = await db.get(Usuario, usuario_id)
    if not obj:
        if not usuario:
            raise HTTPException(404, "Usuario no encontrado")
        obj = UsuarioPermiso(
            usuario_id=usuario_id,
            permiso_id=permiso_id,
            tiene_acceso=valores.get("tiene_acceso", True),
        )
        db.add(obj)
    else:
        for k, v in valores.items():
            setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)

    nombre = usuario.nombre if usuario else usuario_id
    _registrar(db, actor, "editar", f"Cambió el permiso {permiso_id} de {nombre} a {obj.tiene_acceso}")
    await db.flush()
    return obj


@router.delete("/{usuario_id}/permisos/{permiso_id}", status_code=204)
async def eliminar_permiso_usuario(
    usuario_id: str, permiso_id: int,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.execute(
        select(UsuarioPermiso).where(
            UsuarioPermiso.usuario_id == usuario_id,
            UsuarioPermiso.permiso_id == permiso_id,
        )
    )
    obj = obj.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Permiso de usuario no encontrado")
    await db.delete(obj)

    usuario = await db.get(Usuario, usuario_id)
    nombre = usuario.nombre if usuario else usuario_id
    _registrar(db, actor, "editar", f"Quitó la personalización del permiso {permiso_id} de {nombre}")
    await db.flush()
