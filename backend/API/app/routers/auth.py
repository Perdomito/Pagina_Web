import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Usuario, Rol, Pais, Notificacion
from app.schemas import LoginRequest, TokenResponse, UsuarioLoginOut, ForgotPasswordRequest
from app.auth_middleware import create_access_token

PERMISO_NAMES = {
    1: "estudios_biblicos",
    2: "reportes",
    3: "miembros",
    4: "contactos",
    5: "administracion",
    6: "estadisticas",
    7: "configuracion",
    8: "leyes",
}

ROL_ADMIN_ID = 1

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

    pais_nombre = None
    if user.pais_id is not None:
        pais_obj = await db.get(Pais, user.pais_id)
        pais_nombre = pais_obj.nombre if pais_obj else None

    token = create_access_token(user.id, user.rol, user.pais_id)
    usuario_out = UsuarioLoginOut(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol_id=user.rol,
        rol_nombre=rol_nombre,
        activo=user.activo,
        region=user.region,
        pais_id=user.pais_id,
        pais_nombre=pais_nombre,
        ciudad_id=user.ciudad_id,
        miembro_id=user.miembro_id,
    )
    return TokenResponse(token=token, usuario=usuario_out)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    No mandamos correo real (no hay servicio de email configurado).
    En vez de eso, avisamos al Administrador dentro de la app para que
    contacte a la persona y le cambie la contrasena a mano.
    Por seguridad, siempre respondemos igual exista o no ese correo.
    """
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        db.add(
            Notificacion(
                mensaje=f"{user.nombre} ({user.email}) pidio recuperar su contrasena. Contactala para cambiarsela desde Configuracion.",
                tipo="recuperar_password",
                rol_destino_id=ROL_ADMIN_ID,
            )
        )
        await db.flush()
    return {"ok": True}


from app.auth_middleware import get_current_user


@router.get("/mis-permisos")
async def mis_permisos(user: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import RolPermiso, UsuarioPermiso

    rol_result = await db.execute(
        select(RolPermiso.permiso_id, RolPermiso.activo)
        .where(RolPermiso.rol_id == user.rol)
    )
    permisos_finales = {p.permiso_id: p.activo for p in rol_result.all()}

    usuario_result = await db.execute(
        select(UsuarioPermiso.permiso_id, UsuarioPermiso.tiene_acceso)
        .where(UsuarioPermiso.usuario_id == user.id)
    )
    for permiso_id, tiene_acceso in usuario_result.all():
        permisos_finales[permiso_id] = tiene_acceso

    return {
        "usuario_id": user.id,
        "rol_id": user.rol,
        "permisos": [
            {
                "permiso_id": permiso_id,
                "nombre": PERMISO_NAMES.get(permiso_id, ""),
                "activo": activo,
            }
            for permiso_id, activo in permisos_finales.items()
        ],
    }
