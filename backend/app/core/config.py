from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    """
    Configuración de la aplicación
    """
    PROJECT_NAME: str = "Ventas Contables API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database - PostgreSQL en producción, SQLite en desarrollo
    DATABASE_URL: str = "sqlite:///./ventas_contables.db"

    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS - acepta string separado por comas o lista
    CORS_ORIGINS: Union[List[str], str] = "http://localhost:5173,http://localhost:3000,https://ventas-contables-web.vercel.app"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Convertir string separado por comas a lista"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # File upload
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "/tmp/uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
