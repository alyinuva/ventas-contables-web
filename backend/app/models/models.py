from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class ProductoCuenta(Base):
    """
    Modelo para el diccionario de productos a cuentas contables
    Equivalente a DiccionarioCuentas2.xlsx
    """
    __tablename__ = "productos_cuentas"

    id = Column(Integer, primary_key=True, index=True)
    producto = Column(String(255), unique=True, index=True, nullable=False)
    cuenta_contable = Column(String(50), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ComboSalto(Base):
    """
    Modelo para el diccionario de combos con número de salto
    Equivalente a ComboSalto.xlsx
    """
    __tablename__ = "combos_salto"

    id = Column(Integer, primary_key=True, index=True)
    combo = Column(String(255), unique=True, index=True, nullable=False)
    salto = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ProcesamientoHistorial(Base):
    """
    Modelo para el historial de procesamientos
    """
    __tablename__ = "procesamiento_historial"

    id = Column(Integer, primary_key=True, index=True)
    nombre_archivo = Column(String(255), nullable=False)
    mes = Column(String(2), nullable=False)
    subdiario_inicial = Column(Integer, nullable=False)
    numero_comprobante_inicial = Column(Integer, nullable=False)
    total_registros_procesados = Column(Integer, default=0)
    total_asientos_generados = Column(Integer, default=0)
    codigos_faltantes = Column(Text, nullable=True)  # JSON string
    archivo_salida = Column(String(255), nullable=True)
    estado = Column(String(50), default="completado")  # completado, error
    mensaje_error = Column(Text, nullable=True)
    procesado_por = Column(String(255), nullable=True)  # Usuario
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Usuario(Base):
    """
    Modelo para usuarios del sistema
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True)
    es_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
