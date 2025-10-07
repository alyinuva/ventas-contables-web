"""
Schemas de Pydantic para la API
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# --- Schemas para ProductoCuenta ---
class ProductoCuentaBase(BaseModel):
    producto: str = Field(..., max_length=255)
    cuenta_contable: str = Field(..., max_length=50)
    activo: bool = True


class ProductoCuentaCreate(ProductoCuentaBase):
    pass


class ProductoCuentaUpdate(BaseModel):
    producto: Optional[str] = Field(None, max_length=255)
    cuenta_contable: Optional[str] = Field(None, max_length=50)
    activo: Optional[bool] = None


class ProductoCuenta(ProductoCuentaBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Schemas para ComboSalto ---
class ComboSaltoBase(BaseModel):
    combo: str = Field(..., max_length=255)
    salto: int = Field(..., ge=1)
    activo: bool = True


class ComboSaltoCreate(ComboSaltoBase):
    pass


class ComboSaltoUpdate(BaseModel):
    combo: Optional[str] = Field(None, max_length=255)
    salto: Optional[int] = Field(None, ge=1)
    activo: Optional[bool] = None


class ComboSalto(ComboSaltoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Schemas para Procesamiento ---
class ProcesamientoRequest(BaseModel):
    mes: str = Field(..., regex=r'^\d{2}$', description="Mes en formato 01-12")
    subdiario_inicial: int = Field(..., ge=1, description="Número de subdiario inicial")
    numero_comprobante_inicial: int = Field(..., ge=1, le=9999, description="Número de comprobante inicial")


class ProcesamientoResponse(BaseModel):
    id: int
    nombre_archivo: str
    total_registros_procesados: int
    total_asientos_generados: int
    codigos_faltantes: List[str]
    archivo_salida_url: str
    mensaje: str


# --- Schemas para Historial ---
class HistorialItem(BaseModel):
    id: int
    nombre_archivo: str
    mes: str
    subdiario_inicial: int
    numero_comprobante_inicial: int
    total_registros_procesados: int
    total_asientos_generados: int
    codigos_faltantes: Optional[str] = None
    estado: str
    mensaje_error: Optional[str] = None
    procesado_por: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Schemas para Usuario ---
class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str = Field(..., max_length=255)


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    password: Optional[str] = Field(None, min_length=6)
    activo: Optional[bool] = None


class Usuario(UsuarioBase):
    id: int
    activo: bool
    es_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Schemas para Autenticación ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Schemas genéricos ---
class Message(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
