from urllib.parse import unquote, urlparse, urlunparse
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

_database_url = settings.DATABASE_URL
_connect_args = {}
if "sslmode=require" in _database_url:
    _database_url = _database_url.replace("sslmode=require", "")
    if _database_url.endswith("?") or _database_url.endswith("&"):
        _database_url = _database_url.rstrip("?&")
    _connect_args["ssl"] = "require"

parsed = urlparse(_database_url)
decoded_path = unquote(parsed.path)
if decoded_path != parsed.path:
    _database_url = _database_url.replace(parsed.path, decoded_path, 1)

engine = create_async_engine(
    _database_url,
    echo=settings.ENVIRONMENT == "development",
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
