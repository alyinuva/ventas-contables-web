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
from app.api.deps import get_current_user, validate_excel_file
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
    temp_path = None
    try:
        validate_excel_file(archivo)

        # Guardar archivo temporal
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        temp_path = os.path.join(settings.UPLOAD_DIR, f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{archivo.filename}")

        with open(temp_path, "wb") as f:
            content = await archivo.read()
            f.write(content)

        # Leer Excel
        df = read_excel_file(temp_path)

        # Verificar columnas
        if df.shape[1] < 2:
            raise HTTPException(status_code=400, detail="El archivo debe tener al menos 2 columnas")

        # Asignar nombres a las primeras dos columnas
        col_names = ['Producto', 'Asiento'] + [f'Extra_{i}' for i in range(df.shape[1] - 2)]
        df.columns = col_names[:df.shape[1]]

        # Importar con commits por lotes
        count = 0
        errores = []
        BATCH_SIZE = 100

        for idx, row in df.iterrows():
            try:
                raw_producto = row['Producto']
                raw_cuenta = row['Asiento']

                if pd.isna(raw_producto) or pd.isna(raw_cuenta):
                    continue

                producto = str(raw_producto).strip()
                cuenta = str(raw_cuenta).strip()

                if not producto or not cuenta or producto.lower() == 'nan' or cuenta.lower() == 'nan':
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

                # Commit por lotes
                if count % BATCH_SIZE == 0:
                    db.commit()

            except Exception as e:
                errores.append(f"Fila {idx}: {str(e)}")
                db.rollback()
                continue

        # Commit final
        db.commit()

        mensaje = f"{count} productos importados exitosamente"
        if errores:
            mensaje += f" (con {len(errores)} errores)"

        return schemas.Message(message=mensaje)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = f"Error al importar productos: {str(e)}"
        print(f"[ERROR] {error_msg}")  # Log para Railway
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        # Limpiar archivo temporal
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"[WARNING] No se pudo eliminar archivo temporal: {e}")


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
    temp_path = None
    try:
        validate_excel_file(archivo)

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        temp_path = os.path.join(settings.UPLOAD_DIR, f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{archivo.filename}")

        with open(temp_path, "wb") as f:
            content = await archivo.read()
            f.write(content)

        df = read_excel_file(temp_path)

        if df.shape[1] < 2:
            raise HTTPException(status_code=400, detail="El archivo debe tener al menos 2 columnas")

        col_names = ['Combo', 'Salto'] + [f'Extra_{i}' for i in range(df.shape[1] - 2)]
        df.columns = col_names[:df.shape[1]]

        count = 0
        errores = []
        BATCH_SIZE = 100

        for idx, row in df.iterrows():
            try:
                raw_combo = row['Combo']
                raw_salto = row['Salto']

                if pd.isna(raw_combo) or pd.isna(raw_salto):
                    continue

                combo = str(raw_combo).strip()
                if not combo or combo.lower() == 'nan':
                    continue

                try:
                    salto = int(raw_salto)
                except (ValueError, TypeError):
                    try:
                        salto = int(float(raw_salto))
                    except (ValueError, TypeError):
                        errores.append(f"Fila {idx}: salto inválido '{raw_salto}'")
                        continue

                existe = db.query(ComboSalto).filter(ComboSalto.combo == combo).first()

                if existe:
                    existe.salto = salto
                    existe.activo = True
                else:
                    nuevo = ComboSalto(combo=combo, salto=salto, activo=True)
                    db.add(nuevo)
                count += 1

                # Commit por lotes
                if count % BATCH_SIZE == 0:
                    db.commit()

            except Exception as e:
                errores.append(f"Fila {idx}: {str(e)}")
                db.rollback()
                continue

        # Commit final
        db.commit()

        mensaje = f"{count} combos importados exitosamente"
        if errores:
            mensaje += f" (con {len(errores)} errores)"

        return schemas.Message(message=mensaje)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = f"Error al importar combos: {str(e)}"
        print(f"[ERROR] {error_msg}")  # Log para Railway
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        # Limpiar archivo temporal
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"[WARNING] No se pudo eliminar archivo temporal: {e}")
