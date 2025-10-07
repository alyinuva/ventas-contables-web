# 🚀 Guía de Inicio Rápido

## Opción 1: Con Docker (Más Fácil)

```bash
# 1. Asegúrate de tener Docker instalado
docker --version

# 2. Construir y ejecutar
docker-compose up -d

# 3. Espera unos segundos y abre en tu navegador:
http://localhost:3000

# 4. Login con credenciales por defecto:
Email: admin@ventas.com
Password: admin123
```

## Opción 2: Desarrollo Local

### Backend (Terminal 1)

```bash
cd backend

# Crear y activar entorno virtual
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Inicializar base de datos con datos de los archivos Excel
python -m app.init_db

# Ejecutar servidor (puerto 8000)
uvicorn app.main:app --reload
```

### Frontend (Terminal 2)

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env

# Ejecutar en desarrollo (puerto 5173)
npm run dev
```

Luego abre: **http://localhost:5173**

## 📝 Primeros Pasos

1. **Login**: Usa `admin@ventas.com` / `admin123`

2. **Verificar Configuración**:
   - Ve a **Configuración**
   - Verifica que se hayan importado los productos y combos

3. **Procesar un Archivo**:
   - Ve a **Procesar**
   - Arrastra tu archivo de ventas (ej: del01al10deset.xls)
   - Configura: Mes (08), Subdiario (1), Comprobante (1)
   - Click en **Procesar Archivo**
   - Descarga el resultado

4. **Ver Historial**:
   - Ve a **Historial**
   - Revisa todos los procesamientos
   - Descarga archivos anteriores

## 🛠️ Comandos Útiles

```bash
# Ver logs de Docker
docker-compose logs -f

# Parar contenedores
docker-compose down

# Reconstruir después de cambios
docker-compose up -d --build

# Acceder a la base de datos del backend
docker exec -it reportes-a-asientos-backend-1 sqlite3 /app/ventas_contables.db
```

## 🔧 Solución de Problemas

### Puerto 3000 o 8000 ya en uso
```bash
# Cambiar puertos en docker-compose.yml
# Frontend: "3001:80" en vez de "3000:80"
# Backend: "8001:8000" en vez de "8000:8000"
```

### Base de datos vacía
```bash
# Volver a inicializar
cd backend
python -m app.init_db
```

### Frontend no se conecta al backend
```bash
# Verificar archivo .env en frontend/
# Debe tener: VITE_API_URL=http://localhost:8000/api/v1
```

## 📚 Documentación API

Una vez que el backend esté corriendo, visita:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## ✨ Próximos Pasos

1. Importa tus propios archivos DiccionarioCuentas2.xlsx y ComboSalto.xlsx
2. Procesa tus reportes de ventas
3. Personaliza la configuración según tus necesidades
4. Despliega en producción (Railway, Render, o tu VPS)

---

**¿Necesitas ayuda?** Revisa el README.md completo o contacta al desarrollador.
