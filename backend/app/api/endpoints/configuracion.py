"""
Endpoints para configuración de diccionarios
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import os
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user
from app.api import schemas
from app.models.models import ProductoCuenta, ComboSalto, Usuario
from app.utils.excel_reader import read_excel_file

router = APIRouter()


# --- Endpoints para ProductoCuenta ---
@router.get("/productos-cuentas", response_model=List[schemas.ProductoCuenta])
def listar_productos_cuentas(
    skip: int = 0,
    limit: int = 100,
    activo: bool = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar productos y sus cuentas contables"""
    query = db.query(ProductoCuenta)
    if activo is not None:
        query = query.filter(ProductoCuenta.activo == activo)
    return query.offset(skip).limit(limit).all()


@router.post("/productos-cuentas", response_model=schemas.ProductoCuenta)
def crear_producto_cuenta(
    producto_cuenta: schemas.ProductoCuentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear nuevo producto con su cuenta contable"""
    # Verificar si ya existe
    existe = db.query(ProductoCuenta).filter(
        ProductoCuenta.producto == producto_cuenta.producto
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="El producto ya existe")

    db_producto = ProductoCuenta(**producto_cuenta.dict())
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto


@router.put("/productos-cuentas/{producto_id}", response_model=schemas.ProductoCuenta)
def actualizar_producto_cuenta(
    producto_id: int,
    producto_cuenta: schemas.ProductoCuentaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar producto y cuenta contable"""
    db_producto = db.query(ProductoCuenta).filter(ProductoCuenta.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    update_data = producto_cuenta.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_producto, field, value)

    db.commit()
    db.refresh(db_producto)
    return db_producto


@router.delete("/productos-cuentas/{producto_id}", response_model=schemas.Message)
def eliminar_producto_cuenta(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar (desactivar) producto"""
    db_producto = db.query(ProductoCuenta).filter(ProductoCuenta.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db_producto.activo = False
    db.commit()
    return schemas.Message(message="Producto desactivado exitosamente")


@router.post("/productos-cuentas/importar", response_model=schemas.Message)
async def importar_productos_cuentas(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Importar productos desde archivo Excel"""
    try:
        # Guardar archivo temporal
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        temp_path = os.path.join(settings.UPLOAD_DIR, f"temp_{archivo.filename}")

        with open(temp_path, "wb") as f:
            content = await archivo.read()
            f.write(content)

        # Leer Excel
        df = read_excel_file(temp_path)

        # Verificar columnas
        if df.shape[1] < 2:
            raise HTTPException(status_code=400, detail="El archivo debe tener al menos 2 columnas")

        # Asignar nombres a las primeras dos columnas
        df.columns.values[0] = 'Producto'
        df.columns.values[1] = 'Asiento'

        # Importar
        count = 0
        for _, row in df.iterrows():
            producto = str(row['Producto']).strip()
            cuenta = str(row['Asiento']).strip()

            if pd.isna(producto) or pd.isna(cuenta):
                continue

            # Buscar si existe
            existe = db.query(ProductoCuenta).filter(
                ProductoCuenta.producto == producto
            ).first()

            if existe:
                existe.cuenta_contable = cuenta
                existe.activo = True
            else:
                nuevo = ProductoCuenta(
                    producto=producto,
                    cuenta_contable=cuenta,
                    activo=True
                )
                db.add(nuevo)
            count += 1

        db.commit()

        # Limpiar archivo temporal
        os.remove(temp_path)

        return schemas.Message(message=f"{count} productos importados exitosamente")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al importar: {str(e)}")


# --- Endpoints para ComboSalto ---
@router.get("/combos-salto", response_model=List[schemas.ComboSalto])
def listar_combos_salto(
    activo: bool = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar combos y sus reglas de salto"""
    query = db.query(ComboSalto)
    if activo is not None:
        query = query.filter(ComboSalto.activo == activo)
    return query.all()


@router.post("/combos-salto", response_model=schemas.ComboSalto)
def crear_combo_salto(
    combo_salto: schemas.ComboSaltoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear nuevo combo con regla de salto"""
    existe = db.query(ComboSalto).filter(ComboSalto.combo == combo_salto.combo).first()
    if existe:
        raise HTTPException(status_code=400, detail="El combo ya existe")

    db_combo = ComboSalto(**combo_salto.dict())
    db.add(db_combo)
    db.commit()
    db.refresh(db_combo)
    return db_combo


@router.put("/combos-salto/{combo_id}", response_model=schemas.ComboSalto)
def actualizar_combo_salto(
    combo_id: int,
    combo_salto: schemas.ComboSaltoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar combo y regla de salto"""
    db_combo = db.query(ComboSalto).filter(ComboSalto.id == combo_id).first()
    if not db_combo:
        raise HTTPException(status_code=404, detail="Combo no encontrado")

    update_data = combo_salto.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_combo, field, value)

    db.commit()
    db.refresh(db_combo)
    return db_combo


@router.delete("/combos-salto/{combo_id}", response_model=schemas.Message)
def eliminar_combo_salto(
    combo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar (desactivar) combo"""
    db_combo = db.query(ComboSalto).filter(ComboSalto.id == combo_id).first()
    if not db_combo:
        raise HTTPException(status_code=404, detail="Combo no encontrado")

    db_combo.activo = False
    db.commit()
    return schemas.Message(message="Combo desactivado exitosamente")


@router.post("/combos-salto/importar", response_model=schemas.Message)
async def importar_combos_salto(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Importar combos desde archivo Excel"""
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        temp_path = os.path.join(settings.UPLOAD_DIR, f"temp_{archivo.filename}")

        with open(temp_path, "wb") as f:
            content = await archivo.read()
            f.write(content)

        df = read_excel_file(temp_path)

        if df.shape[1] < 2:
            raise HTTPException(status_code=400, detail="El archivo debe tener al menos 2 columnas")

        df.columns.values[0] = 'Combo'
        df.columns.values[1] = 'Salto'

        count = 0
        for _, row in df.iterrows():
            combo = str(row['Combo']).strip()
            salto = int(row['Salto'])

            if pd.isna(combo) or pd.isna(salto):
                continue

            existe = db.query(ComboSalto).filter(ComboSalto.combo == combo).first()

            if existe:
                existe.salto = salto
                existe.activo = True
            else:
                nuevo = ComboSalto(combo=combo, salto=salto, activo=True)
                db.add(nuevo)
            count += 1

        db.commit()
        os.remove(temp_path)

        return schemas.Message(message=f"{count} combos importados exitosamente")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al importar: {str(e)}")
