"""
Aplicación principal FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.core.init_db import init_db
from app.api.endpoints import procesamiento, configuracion, historial, auth

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Inicializar base de datos y crear usuario admin
init_db()

# Crear directorio de uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Crear aplicación
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API para convertir reportes de ventas a asientos contables para Concar"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Incluir routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Autenticación"]
)

app.include_router(
    procesamiento.router,
    prefix=f"{settings.API_V1_STR}/procesamiento",
    tags=["Procesamiento"]
)

app.include_router(
    configuracion.router,
    prefix=f"{settings.API_V1_STR}/configuracion",
    tags=["Configuración"]
)

app.include_router(
    historial.router,
    prefix=f"{settings.API_V1_STR}/historial",
    tags=["Historial"]
)


@app.get("/")
def root():
    """Endpoint raíz"""
    return {
        "message": "API de Ventas Contables",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
