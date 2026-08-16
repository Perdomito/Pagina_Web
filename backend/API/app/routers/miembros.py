from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Miembro, TipoMiembroEnum, Notificacion, Pais, Auditoria, Usuario
from app.schemas import MiembroCreate, MiembroUpdate, MiembroOut
from app.auth_middleware import get_current_user

router = APIRouter(prefix="/miembros", tags=["Miembros"])

ROL_PASTOR_ID = 2


async def _nombre_pais(db: AsyncSession, pais_id: int | None) -> str:
    if not pais_id:
        return "-"
    pais = await db.get(Pais, pais_id)
    return pais.nombre if pais else "-"


def _registrar(db: AsyncSession, actor: Usuario, accion: str, descripcion: str):
    db.add(
        Auditoria(
            usuario_id=actor.id,
            usuario_nombre=actor.nombre,
            modulo="miembros",
            accion=accion,
            descripcion=descripcion,
        )
    )


@router.get("", response_model=list[MiembroOut])
async def listar(
    tipo_miembro: TipoMiembroEnum | None = Query(None, description="Filtrar por tipo de miembro"),
    pais_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Miembro).order_by(Miembro.nombre)
    if tipo_miembro:
        q = q.where(Miembro.tipo_miembro == tipo_miembro)
    if pais_id:
        q = q.where(Miembro.pais_id == pais_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=MiembroOut)
async def obtener(id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Miembro, id)
    if not obj:
        raise HTTPException(404, "Miembro no encontrado")
    return obj


@router.post("", response_model=MiembroOut, status_code=201)
async def crear(
    data: MiembroCreate,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(Miembro, data.id)
    if existing:
        raise HTTPException(400, f"Ya existe un miembro con id '{data.id}'")
    obj = Miembro(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)

    nombre_pais = await _nombre_pais(db, obj.pais_id)
    db.add(
        Notificacion(
            mensaje=f"Nuevo miembro registrado: {obj.nombre} ({nombre_pais})",
            tipo="nuevo_miembro",
            rol_destino_id=ROL_PASTOR_ID,
        )
    )
    _registrar(db, actor, "crear", f"Registró al miembro {obj.nombre} ({nombre_pais})")
    await db.flush()
    return obj


@router.patch("/{id}", response_model=MiembroOut)
async def actualizar(
    id: str,
    data: MiembroUpdate,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Miembro, id)
    if not obj:
        raise HTTPException(404, "Miembro no encontrado")

    cambios = data.model_dump(exclude_unset=True)
    ciudad_anterior = obj.ciudad
    pais_anterior_id = obj.pais_id

    for k, v in cambios.items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)

    # Cambio de ciudad de misión
    if "ciudad" in cambios and ciudad_anterior != obj.ciudad and ciudad_anterior:
        db.add(
            Notificacion(
                mensaje=f"{obj.nombre} cambió de ciudad: {ciudad_anterior} → {obj.ciudad or '-'}",
                tipo="cambio_ciudad",
                rol_destino_id=ROL_PASTOR_ID,
            )
        )

    # Traslado de región/país
    if "pais_id" in cambios and pais_anterior_id != obj.pais_id and pais_anterior_id:
        nombre_anterior = await _nombre_pais(db, pais_anterior_id)
        nombre_nuevo = await _nombre_pais(db, obj.pais_id)
        db.add(
            Notificacion(
                mensaje=f"{obj.nombre} fue trasladado: {nombre_anterior} → {nombre_nuevo}",
                tipo="traslado_pais",
                rol_destino_id=ROL_PASTOR_ID,
            )
        )

    _registrar(db, actor, "editar", f"Editó al miembro {obj.nombre}")
    await db.flush()
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(
    id: str,
    actor: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await db.get(Miembro, id)
    if not obj:
        raise HTTPException(404, "Miembro no encontrado")
    nombre = obj.nombre
    await db.delete(obj)
    _registrar(db, actor, "eliminar", f"Eliminó al miembro {nombre}")
    await db.flush()
