from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Notificacion, Usuario
from app.schemas import NotificacionOut
from app.auth_middleware import get_current_user

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("", response_model=list[NotificacionOut])
async def listar(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Notificacion)
        .where(Notificacion.rol_destino_id == user.rol)
        .order_by(Notificacion.fecha.desc())
        .limit(50)
    )
    result = await db.execute(q)
    return result.scalars().all()


@router.patch("/{notificacion_id}/leer", response_model=NotificacionOut)
async def marcar_leida(
    notificacion_id: int,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Notificacion, notificacion_id)
    if not obj or obj.rol_destino_id != user.rol:
        raise HTTPException(404, "Notificacion no encontrada")
    obj.leida = True
    await db.flush()
    await db.refresh(obj)
    return obj
