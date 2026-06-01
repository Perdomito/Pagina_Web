import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Usuario, Rol
from app.schemas import LoginRequest, TokenResponse, UsuarioLoginOut
from app.auth_middleware import create_access_token

PERMISO_NAMES = {
    1: "miembros",
    2: "estudios_biblicos",
    3: "reportes",
    4: "contactos",
    5: "administracion",
    6: "configuracion",
}

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Email o contrasena incorrectos")
    try:
        pwd_bytes = data.password.encode("utf-8")
        hash_bytes = user.password_hash.encode("utf-8")
        if not _bcrypt.checkpw(pwd_bytes, hash_bytes):
            raise HTTPException(401, "Email o contrasena incorrectos")
    except Exception:
        raise HTTPException(401, "Email o contrasena incorrectos")
    if not user.activo:
        raise HTTPException(403, "Usuario inactivo")

    rol_result = await db.execute(select(Rol).where(Rol.id == user.rol))
    rol_obj = rol_result.scalar_one_or_none()
    rol_nombre = rol_obj.nombre if rol_obj else ""

    token = create_access_token(user.id, user.rol)
    usuario_out = UsuarioLoginOut(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol_id=user.rol,
        rol_nombre=rol_nombre,
        activo=user.activo,
    )
    return TokenResponse(token=token, usuario=usuario_out)


from app.auth_middleware import get_current_user


@router.get("/mis-permisos")
async def mis_permisos(user: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import RolPermiso
    result = await db.execute(
        select(RolPermiso.permiso_id, RolPermiso.activo)
        .where(RolPermiso.rol_id == user.rol)
    )
    permisos = result.all()
    return {
        "usuario_id": user.id,
        "rol_id": user.rol,
        "permisos": [
            {
                "permiso_id": p.permiso_id,
                "nombre": PERMISO_NAMES.get(p.permiso_id, ""),
                "activo": p.activo,
            }
            for p in permisos
        ],
    }