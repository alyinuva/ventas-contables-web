/**
 * Tipos TypeScript para la aplicación
 */

export interface ProductoCuenta {
  id: number
  producto: string
  cuenta_contable: string
  activo: boolean
  created_at: string
  updated_at?: string
}

export interface ProductoCuentaCreate {
  producto: string
  cuenta_contable: string
  activo?: boolean
}

export interface ComboSalto {
  id: number
  combo: string
  salto: number
  activo: boolean
  created_at: string
  updated_at?: string
}

export interface ComboSaltoCreate {
  combo: string
  salto: number
  activo?: boolean
}

export interface ProcesamientoRequest {
  mes: string
  subdiario_inicial: number
  numero_comprobante_inicial: number
}

export interface ProcesamientoResponse {
  id: number
  nombre_archivo: string
  total_registros_procesados: number
  total_asientos_generados: number
  codigos_faltantes: string[]
  archivo_salida_url: string
  mensaje: string
}

export interface HistorialItem {
  id: number
  nombre_archivo: string
  mes: string
  subdiario_inicial: number
  numero_comprobante_inicial: number
  total_registros_procesados: number
  total_asientos_generados: number
  codigos_faltantes?: string
  estado: string
  mensaje_error?: string
  procesado_por?: string
  created_at: string
}

export interface Usuario {
  id: number
  email: string
  nombre: string
  activo: boolean
  es_admin: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  nombre: string
  password: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface ApiError {
  detail: string
}
