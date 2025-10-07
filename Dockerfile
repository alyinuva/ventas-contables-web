FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements desde backend/
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY backend/app ./app

# Crear directorio de uploads
RUN mkdir -p /app/uploads

# Exponer puerto
EXPOSE 8000

# Comando de inicio - usa variable PORT de Railway o 8000 por defecto
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
