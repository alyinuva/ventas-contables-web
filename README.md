# Ventas Contables - Web App

Sistema web para convertir reportes de ventas a asientos contables para Concar.

## 🚀 Características

- **Procesamiento de archivos Excel**: Sube reportes de ventas (.xls, .xlsx) y conviértelos automáticamente a asientos contables
- **Gestión de configuración**: Administra el diccionario de productos/cuentas y reglas de combos
- **Historial completo**: Revisa procesamientos anteriores y descarga archivos
- **Interfaz moderna**: Diseño profesional con drag & drop y UI intuitiva
- **Autenticación segura**: Sistema de login con JWT

## 📋 Requisitos

- Python 3.11+
- Node.js 20+
- Docker (opcional)

## 🛠️ Instalación y Ejecución

### Opción 1: Con Docker (Recomendado)

```bash
# Construir y ejecutar
docker-compose up -d

# La aplicación estará disponible en:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### Opción 2: Desarrollo Local

#### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Inicializar base de datos
python -m app.init_db

# Ejecutar servidor
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar .env
cp .env.example .env

# Ejecutar en desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
ventas-contables-web/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints REST
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── services/     # Lógica de negocio
│   │   ├── core/         # Configuración, seguridad
│   │   └── utils/        # Utilidades
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas principales
│   │   ├── services/     # Cliente API
│   │   ├── lib/          # Utilidades
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔐 Credenciales por Defecto

```
Email: admin@ventas.com
Password: admin123
```

## 📖 Uso

### 1. Procesar Archivo de Ventas

1. Ve a la página **Procesar**
2. Arrastra o selecciona tu archivo Excel de ventas
3. Configura los parámetros:
   - **Mes**: 01-12
   - **Subdiario Inicial**: Número del subdiario
   - **Número de Comprobante Inicial**: 1-9999
4. Haz clic en **Procesar Archivo**
5. Descarga el archivo Excel generado para Concar

### 2. Gestionar Configuración

#### Productos y Cuentas
- Importa tu archivo DiccionarioCuentas2.xlsx
- Agrega productos manualmente
- Edita o elimina productos existentes

#### Combos
- Importa tu archivo ComboSalto.xlsx
- Configura reglas de salto para productos combo

### 3. Revisar Historial

- Ve a la página **Historial**
- Revisa procesamientos anteriores
- Descarga archivos procesados
- Elimina registros antiguos

## 🎨 Tecnologías

### Backend
- **FastAPI**: Framework web moderno
- **SQLAlchemy**: ORM para base de datos
- **Pandas**: Procesamiento de Excel
- **JWT**: Autenticación segura

### Frontend
- **React 18**: Library UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utility-first
- **React Query**: Gestión de estado del servidor
- **React Dropzone**: Drag & drop de archivos

## 📝 API Endpoints

```
POST   /api/v1/auth/login              - Login
POST   /api/v1/auth/registro           - Registro
GET    /api/v1/auth/yo                 - Usuario actual

GET    /api/v1/configuracion/productos-cuentas    - Listar productos
POST   /api/v1/configuracion/productos-cuentas    - Crear producto
PUT    /api/v1/configuracion/productos-cuentas/:id - Actualizar
DELETE /api/v1/configuracion/productos-cuentas/:id - Eliminar
POST   /api/v1/configuracion/productos-cuentas/importar - Importar Excel

GET    /api/v1/configuracion/combos-salto         - Listar combos
POST   /api/v1/configuracion/combos-salto         - Crear combo
PUT    /api/v1/configuracion/combos-salto/:id     - Actualizar
DELETE /api/v1/configuracion/combos-salto/:id     - Eliminar
POST   /api/v1/configuracion/combos-salto/importar - Importar Excel

POST   /api/v1/procesamiento/procesar   - Procesar archivo
GET    /api/v1/procesamiento/descargar/:id - Descargar resultado

GET    /api/v1/historial/               - Listar historial
GET    /api/v1/historial/:id            - Detalle
DELETE /api/v1/historial/:id            - Eliminar
```

Documentación interactiva disponible en: `http://localhost:8000/docs`

## 🚢 Despliegue en Producción

### Railway / Render

1. Conecta tu repositorio
2. Configura variables de entorno:
   - `DATABASE_URL`: URL de PostgreSQL
   - `SECRET_KEY`: Clave secreta
   - `CORS_ORIGINS`: Orígenes permitidos

### VPS con Docker

```bash
# Clonar repositorio
git clone <tu-repo>
cd ventas-contables-web

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores

# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 🆘 Soporte

Para reportar bugs o solicitar features, por favor abre un issue en el repositorio.

---

**Desarrollado con ❤️ para optimizar la gestión contable**
