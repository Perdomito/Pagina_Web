"""Infraestructura de pruebas: SQLite en memoria + cliente ASGI.

No toca Neon ni la base de produccion. Cada test recibe una base vacia creada
desde los propios modelos de SQLAlchemy, asi que un modelo mal declarado
(FK que no resuelve, tipo invalido) hace fallar la suite entera.
"""
import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

# app.database crea su engine al importarse y le pasa pool_size/max_overflow,
# que SQLite no acepta: se le da una URL de Postgres ficticia (nunca se conecta,
# get_db va siempre sobrescrito) y las pruebas usan su propio engine SQLite.
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost/test"

from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Permiso, Rol, Usuario  # noqa: E402

# Los 7 modulos que la UI espera encontrar en el catalogo de permisos.
MODULOS = [
    (1, "Bible Studies"), (2, "Reports"), (3, "Members"), (4, "Contacts"),
    (5, "Administration"), (6, "Statistics"), (7, "Settings"),
]


@pytest_asyncio.fixture
async def sesion():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    fabrica = async_sessionmaker(engine, expire_on_commit=False)
    async with fabrica() as s:
        yield s
    await engine.dispose()


@pytest_asyncio.fixture
async def datos_base(sesion):
    """Roles y catalogo de permisos, como en produccion tras el startup."""
    sesion.add_all([
        Rol(id=1, nombre="admin", descripcion="Administrador"),
        Rol(id=2, nombre="miembro", descripcion="Miembro"),
    ])
    sesion.add_all([Permiso(id=i, nombre=n) for i, n in MODULOS])
    await sesion.commit()
    return sesion


@pytest_asyncio.fixture
async def cliente(datos_base):
    async def _get_db():
        yield datos_base

    app.dependency_overrides[get_db] = _get_db
    transporte = ASGITransport(app=app)
    async with AsyncClient(transport=transporte, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def usuario_payload():
    """Payload exacto que manda el formulario de Configuracion.jsx."""
    return {
        "nombre": "Ana Torres",
        "email": "ana@example.com",
        "password": "secreta123",
        "rol_id": 2,
        "pais_id": "",
    }


@pytest_asyncio.fixture
async def usuario(datos_base):
    obj = Usuario(
        id="U001", nombre="Base", email="base@example.com",
        password_hash="hash-original", rol=2, activo=True,
    )
    datos_base.add(obj)
    await datos_base.commit()
    return obj
