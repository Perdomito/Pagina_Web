from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Rol, RolPermiso, Permiso
from app.schemas import RolCreate, RolUpdate, RolOut, RolPermisoCreate, RolPermisoUpdate, RolPermisoOut

router = APIRouter(prefix="/roles", tags=["Roles y Permisos"])


@router.get("", response_model=list[RolOut])
async def listar(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rol).order_by(Rol.nombre))
    return result.scalars().all()


@router.get("/{id}", response_model=RolOut)
async def obtener(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Rol, id)
    if not obj:
        raise HTTPException(404, "Rol no encontrado")
    return obj


@router.post("", response_model=RolOut, status_code=201)
async def crear(data: RolCreate, db: AsyncSession = Depends(get_db)):
    obj = Rol(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{id}", response_model=RolOut)
async def actualizar(id: int, data: RolUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Rol, id)
    if not obj:
        raise HTTPException(404, "Rol no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Rol, id)
    if not obj:
        raise HTTPException(404, "Rol no encontrado")
    await db.delete(obj)


# ── Permisos ───────────────────────────────────────────────────────────────

@router.get("/{rol_id}/permisos", response_model=list[RolPermisoOut])
async def listar_permisos(rol_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RolPermiso, Permiso.nombre)
        .outerjoin(Permiso, Permiso.id == RolPermiso.permiso_id)
        .where(RolPermiso.rol_id == rol_id)
        .order_by(RolPermiso.permiso_id)
    )
    salida = []
    for rp, nombre in result.all():
        item = RolPermisoOut.model_validate(rp)
        item.nombre = nombre
        salida.append(item)
    return salida


@router.post("/{rol_id}/permisos", response_model=RolPermisoOut, status_code=201)
async def agregar_permiso(rol_id: int, data: RolPermisoCreate, db: AsyncSession = Depends(get_db)):
    if not await db.get(Rol, rol_id):
        raise HTTPException(404, "Rol no encontrado")
    if await db.get(RolPermiso, (rol_id, data.permiso_id)):
        raise HTTPException(400, "El rol ya tiene ese permiso")
    obj = RolPermiso(rol_id=rol_id, permiso_id=data.permiso_id, activo=data.activo)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{rol_id}/permisos/{permiso_id}", response_model=RolPermisoOut)
async def actualizar_permiso(rol_id: int, permiso_id: int, data: RolPermisoUpdate, db: AsyncSession = Depends(get_db)):
    valores = data.model_dump(exclude_unset=True)
    activo = valores.get("activo")
    if activo is None:
        activo = valores.get("tiene_acceso")
    obj = await db.get(RolPermiso, (rol_id, permiso_id))
    if not obj:
        if not await db.get(Rol, rol_id):
            raise HTTPException(404, "Rol no encontrado")
        obj = RolPermiso(
            rol_id=rol_id,
            permiso_id=permiso_id,
            activo=activo if activo is not None else True,
        )
        db.add(obj)
    elif activo is not None:
        obj.activo = activo
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{rol_id}/permisos/{permiso_id}", status_code=204)
async def eliminar_permiso(rol_id: int, permiso_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(RolPermiso, (rol_id, permiso_id))
    if not obj:
        raise HTTPException(404, "Permiso no encontrado")
    await db.delete(obj)
