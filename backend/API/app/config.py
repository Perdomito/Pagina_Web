from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    ENVIRONMENT: str = "production"

    class Config:
        env_file = ".env"


settings = Settings()
