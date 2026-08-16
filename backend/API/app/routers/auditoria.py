from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Auditoria, Usuario
from app.schemas import AuditoriaOut
from app.auth_middleware import get_current_user

router = APIRouter(prefix="/auditoria", tags=["Auditoria"])

ROL_ADMIN_ID = 1


@router.get("", response_model=list[AuditoriaOut])
async def listar(
    modulo: str | None = Query(None),
    usuario_id: str | None = Query(None),
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if actor.rol != ROL_ADMIN_ID:
        raise HTTPException(403, "Solo el Administrador puede ver el historial")

    q = select(Auditoria).order_by(Auditoria.fecha.desc()).limit(300)
    if modulo:
        q = q.where(Auditoria.modulo == modulo)
    if usuario_id:
        q = q.where(Auditoria.usuario_id == usuario_id)
    result = await db.execute(q)
    return result.scalars().all()
