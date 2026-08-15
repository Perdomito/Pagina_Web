from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    # Sin default: la app no arranca si no se define por variable de entorno.
    # Evita el escenario silencioso de produccion con clave publica.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ENVIRONMENT: str = "production"

    # Origenes permitidos para CORS (CSV). El frontend usa Bearer token en header,
    # no cookies, por lo que allow_credentials queda en False.
    ALLOWED_ORIGINS: str = "*"

    # Almacenamiento de archivos (Supabase Storage)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "archivos"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
