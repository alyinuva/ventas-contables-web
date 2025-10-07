# 🚀 Guía de Despliegue

## Despliegue en Railway (Backend) + Vercel (Frontend)

### Preparación

1. **Crear cuenta en Railway**: https://railway.app (login con GitHub)
2. **Crear cuenta en Vercel**: https://vercel.com (login con GitHub)

---

## 📦 Paso 1: Subir a GitHub

```bash
cd "/Users/yigal/Downloads/reportes a asientos"

# Inicializar repositorio
git init
git add .
git commit -m "feat: Migración de app desktop a web con FastAPI + React"

# Crear repositorio en GitHub (necesitas GitHub CLI)
gh repo create ventas-contables-web --public --source=. --push

# O manualmente:
# 1. Crea el repo en https://github.com/new
# 2. Luego:
git remote add origin https://github.com/TU-USUARIO/ventas-contables-web.git
git branch -M main
git push -u origin main
```

---

## 🚂 Paso 2: Deploy Backend en Railway

### Opción A: Desde GitHub (Recomendado)

1. Ve a https://railway.app
2. Click **New Project**
3. Selecciona **Deploy from GitHub repo**
4. Elige `ventas-contables-web`
5. Railway detecta Python automáticamente
6. Click en **Deploy**

### Opción B: CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Configurar Variables de Entorno

En el dashboard de Railway:

1. Click en tu servicio → **Variables**
2. Agrega:
   ```
   SECRET_KEY=tu-clave-super-secreta-cambiala-ahora
   CORS_ORIGINS=https://tu-dominio-vercel.vercel.app
   ```

3. **Agregar Base de Datos PostgreSQL** (opcional, más robusto):
   - Click **+ New** → **Database** → **PostgreSQL**
   - Railway automáticamente agrega `DATABASE_URL`
   - Opcional: puedes usar SQLite por ahora

### Inicializar Base de Datos

Una vez desplegado:

1. En Railway, ve a tu servicio → **Settings** → **Deploy**
2. En la terminal de Railway (o localmente conectado):
   ```bash
   railway run python -m app.init_db
   ```

### Obtener URL del Backend

- En Railway dashboard, copia la URL pública
- Ejemplo: `https://ventas-contables-production.up.railway.app`

---

## ⚡ Paso 3: Deploy Frontend en Vercel

### Configurar para Vercel

1. **Actualizar `frontend/vite.config.ts`** para producción:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  // Sin proxy en producción, usamos variable de entorno
})
```

2. **Crear `frontend/vercel.json`**:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Deploy desde GitHub

1. Ve a https://vercel.com
2. Click **Add New** → **Project**
3. Import tu repositorio `ventas-contables-web`
4. **Framework Preset**: Vite
5. **Root Directory**: `frontend`
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. **Environment Variables**:
   ```
   VITE_API_URL=https://tu-backend-railway.up.railway.app/api/v1
   ```
9. Click **Deploy**

### Actualizar CORS en Railway

Una vez que tengas la URL de Vercel (ej: `https://ventas-contables.vercel.app`):

1. Ve a Railway → tu servicio → **Variables**
2. Actualiza `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://ventas-contables.vercel.app,http://localhost:5173
   ```
3. Railway hace redeploy automáticamente

---

## ✅ Verificación

1. **Backend Health Check**:
   ```bash
   curl https://tu-backend-railway.up.railway.app/health
   # Debe retornar: {"status":"ok"}
   ```

2. **Docs API**:
   - Visita: `https://tu-backend-railway.up.railway.app/docs`

3. **Frontend**:
   - Visita: `https://ventas-contables.vercel.app`
   - Login con: `admin@ventas.com` / `admin123`

---

## 🔄 Actualizaciones Futuras

### Backend (Railway)
```bash
git add .
git commit -m "update: descripción del cambio"
git push
# Railway detecta el push y redeploya automáticamente
```

### Frontend (Vercel)
```bash
git add .
git commit -m "update: descripción del cambio"
git push
# Vercel detecta el push y redeploya automáticamente
```

---

## 🐛 Troubleshooting

### Backend no inicia
- Verifica logs en Railway dashboard
- Asegúrate que `requirements.txt` está completo
- Verifica que `SECRET_KEY` está configurado

### Frontend no se conecta al backend
- Verifica `VITE_API_URL` en variables de Vercel
- Verifica `CORS_ORIGINS` en Railway incluye tu dominio de Vercel
- Chequea Network tab en DevTools del navegador

### Base de datos vacía
- Corre `railway run python -m app.init_db` en Railway CLI
- O sube los Excel manualmente desde la UI de Configuración

### Error 404 en rutas del frontend
- Verifica que existe `vercel.json` con rewrites
- Redeploy en Vercel

---

## 💰 Costos

- **Railway**:
  - $5/mes gratis de crédito
  - ~$5/mes después (backend pequeño)

- **Vercel**:
  - 100% GRATIS para proyectos personales
  - Despliegues ilimitados

---

## 🎉 URLs Finales

Una vez desplegado, tendrás:

- **App Web**: `https://ventas-contables.vercel.app`
- **API Backend**: `https://tu-app.up.railway.app`
- **API Docs**: `https://tu-app.up.railway.app/docs`

---

## 📝 Siguientes Pasos

1. Configurar dominio custom (opcional)
2. Agregar analytics (Vercel Analytics)
3. Configurar alertas en Railway
4. Backup automático de base de datos

¿Necesitas ayuda con algún paso? Revisa los logs o contacta al equipo.
