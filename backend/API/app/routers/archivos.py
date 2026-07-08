import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models import Archivo, Ingreso, GastoReal
from app.schemas import ArchivoOut

router = APIRouter(prefix="/archivos", tags=["Archivos"])

TIPOS_VALIDOS = {"ingreso", "gasto"}


async def _validar_referencia(db: AsyncSession, tipo: str, referencia_id: int):
    modelo = Ingreso if tipo == "ingreso" else GastoReal
    obj = await db.get(modelo, referencia_id)
    if not obj:
        raise HTTPException(404, f"No existe un {tipo} con id {referencia_id}")


async def _subir_a_supabase(path: str, contenido: bytes, content_type: str) -> str:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(
            503,
            "Almacenamiento de archivos no configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_KEY).",
        )
    base = settings.SUPABASE_URL.rstrip("/")
    bucket = settings.SUPABASE_BUCKET
    upload_url = f"{base}/storage/v1/object/{bucket}/{path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(upload_url, content=contenido, headers=headers)
    if resp.status_code not in (200, 201):
        raise HTTPException(502, f"Error al subir el archivo al almacenamiento: {resp.text}")
    return f"{base}/storage/v1/object/public/{bucket}/{path}"


@router.get("", response_model=list[ArchivoOut])
async def listar(
    tipo: str | None = Query(None),
    referencia_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Archivo).order_by(Archivo.fecha_creacion.desc())
    if tipo:
        q = q.where(Archivo.tipo == tipo)
    if referencia_id:
        q = q.where(Archivo.referencia_id == referencia_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ArchivoOut, status_code=201)
async def subir(
    tipo: str = Form(...),
    referencia_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if tipo not in TIPOS_VALIDOS:
        raise HTTPException(422, "tipo debe ser 'ingreso' o 'gasto'")
    await _validar_referencia(db, tipo, referencia_id)

    contenido = await file.read()
    nombre = file.filename or "archivo"
    path = f"{tipo}/{referencia_id}/{uuid.uuid4().hex}_{nombre}"
    url = await _subir_a_supabase(path, contenido, file.content_type)

    obj = Archivo(
        tipo=tipo,
        referencia_id=referencia_id,
        nombre_original=nombre,
        content_type=file.content_type,
        tamano_bytes=len(contenido),
        storage_path=path,
        url=url,
    )
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
async def eliminar(id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Archivo, id)
    if not obj:
        raise HTTPException(404, "Archivo no encontrado")
    await db.delete(obj)
