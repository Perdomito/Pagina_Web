import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from app.database import get_db
from app.models import Usuario, Rol, Pais
from app.schemas import GoogleLoginRequest, LoginRequest, TokenResponse, UsuarioLoginOut
from app.auth_middleware import create_access_token

# TODO Luis: pegar aqui el Client ID que te da Google Cloud Console
# (termina en .apps.googleusercontent.com)
GOOGLE_CLIENT_ID = "895242622810-8gef0g0svheqiud1muul6e6fgb2ab9v5.apps.googleusercontent.com"

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

router = APIRouter(prefix="/auth", tags=["Auth"])


async def _token_response_para(db: AsyncSession, user: Usuario) -> TokenResponse:
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

    return await _token_response_para(db, user)


@router.post("/google-login", response_model=TokenResponse)
async def google_login(data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    # Verifica el token contra los servidores de Google (firma, expiracion,
    # que sea de nuestra propia app). Si algo no cuadra, tira ValueError.
    try:
        idinfo = google_id_token.verify_oauth2_token(
            data.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(401, "Token de Google invalido o vencido")

    email = idinfo.get("email")
    if not email or not idinfo.get("email_verified"):
        raise HTTPException(401, "Tu correo de Google no esta verificado")

    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            403,
            "Tu correo no tiene acceso todavia. Pidele al administrador que te agregue con este mismo correo de Gmail.",
        )
    if not user.activo:
        raise HTTPException(403, "Usuario inactivo")

    return await _token_response_para(db, user)


from app.auth_middleware import get_current_user


@router.get("/mis-permisos")
async def mis_permisos(user: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import RolPermiso, UsuarioPermiso

    rol_result = await db.execute(
        select(RolPermiso.permiso_id, RolPermiso.activo)
        .where(RolPermiso.rol_id == user.rol)
    )
    # Empezamos con los permisos del rol...
    permisos_finales = {p.permiso_id: p.activo for p in rol_result.all()}

    usuario_result = await db.execute(
        select(UsuarioPermiso.permiso_id, UsuarioPermiso.tiene_acceso)
        .where(UsuarioPermiso.usuario_id == user.id)
    )
    # ...y los personalizados del usuario los pisan (antes esto nunca se leia,
    # asi que la pantalla de "Permisos personalizados de X" no tenia ningun
    # efecto real en la app).
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
