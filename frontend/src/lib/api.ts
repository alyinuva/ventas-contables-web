/**
 * Cliente API para comunicarse con el backend
 */
import axios, { AxiosError } from 'axios'
import type {
  LoginRequest,
  RegisterRequest,
  Token,
  Usuario,
  ProductoCuenta,
  ProductoCuentaCreate,
  ComboSalto,
  ComboSaltoCreate,
  ProcesamientoResponse,
  HistorialItem,
} from '@/types'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1'

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// --- Autenticación ---
export const authApi = {
  login: async (credentials: LoginRequest): Promise<Token> => {
    const { data } = await api.post<Token>('/auth/login', credentials)
    localStorage.setItem('access_token', data.access_token)
    return data
  },

  register: async (userData: RegisterRequest): Promise<Usuario> => {
    const { data } = await api.post<Usuario>('/auth/registro', userData)
    return data
  },

  getCurrentUser: async (): Promise<Usuario> => {
    const { data } = await api.get<Usuario>('/auth/yo')
    return data
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },
}

// --- Productos y Cuentas ---
export const productosApi = {
  getAll: async (activo?: boolean): Promise<ProductoCuenta[]> => {
    const { data } = await api.get<ProductoCuenta[]>('/configuracion/productos-cuentas', {
      params: { activo, limit: 10000 },
    })
    return data
  },

  create: async (producto: ProductoCuentaCreate): Promise<ProductoCuenta> => {
    const { data } = await api.post<ProductoCuenta>('/configuracion/productos-cuentas', producto)
    return data
  },

  update: async (id: number, producto: Partial<ProductoCuentaCreate>): Promise<ProductoCuenta> => {
    const { data } = await api.put<ProductoCuenta>(`/configuracion/productos-cuentas/${id}`, producto)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/configuracion/productos-cuentas/${id}`)
  },

  importar: async (file: File): Promise<{ message: string }> => {
    const formData = new FormData()
    formData.append('archivo', file)
    const { data } = await api.post('/configuracion/productos-cuentas/importar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

// --- Combos ---
export const combosApi = {
  getAll: async (activo?: boolean): Promise<ComboSalto[]> => {
    const { data } = await api.get<ComboSalto[]>('/configuracion/combos-salto', {
      params: { activo },
    })
    return data
  },

  create: async (combo: ComboSaltoCreate): Promise<ComboSalto> => {
    const { data } = await api.post<ComboSalto>('/configuracion/combos-salto', combo)
    return data
  },

  update: async (id: number, combo: Partial<ComboSaltoCreate>): Promise<ComboSalto> => {
    const { data } = await api.put<ComboSalto>(`/configuracion/combos-salto/${id}`, combo)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/configuracion/combos-salto/${id}`)
  },

  importar: async (file: File): Promise<{ message: string }> => {
    const formData = new FormData()
    formData.append('archivo', file)
    const { data } = await api.post('/configuracion/combos-salto/importar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

// --- Procesamiento ---
export const procesamientoApi = {
  procesar: async (
    archivo: File,
    params: {
      mes: string
      subdiario_inicial: number
      numero_comprobante_inicial: number
    }
  ): Promise<ProcesamientoResponse> => {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('mes', params.mes)
    formData.append('subdiario_inicial', params.subdiario_inicial.toString())
    formData.append('numero_comprobante_inicial', params.numero_comprobante_inicial.toString())

    const { data } = await api.post<ProcesamientoResponse>('/procesamiento/procesar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  descargar: (historialId: number): string => {
    return `${API_URL}/procesamiento/descargar/${historialId}`
  },
}

// --- Historial ---
export const historialApi = {
  getAll: async (): Promise<HistorialItem[]> => {
    const { data } = await api.get<HistorialItem[]>('/historial/', {
      params: { limit: 100 },
    })
    return data
  },

  getById: async (id: number): Promise<HistorialItem> => {
    const { data } = await api.get<HistorialItem>(`/historial/${id}`)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/historial/${id}`)
  },
}
