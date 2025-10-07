"""
Endpoints para procesamiento de archivos de ventas
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import os
import json
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import validate_excel_file, get_current_user
from app.api import schemas
from app.models.models import ProcesamientoHistorial, ProductoCuenta, ComboSalto, Usuario
from app.services.procesamiento_service import ProcesamientoService

router = APIRouter()


@router.post("/procesar", response_model=schemas.ProcesamientoResponse)
async def procesar_archivo_ventas(
    archivo: UploadFile = File(..., description="Archivo de ventas Excel"),
    mes: str = Form(..., min_length=2, max_length=2),
    subdiario_inicial: int = Form(..., ge=1),
    numero_comprobante_inicial: int = Form(..., ge=1, le=9999),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: UploadFile = Depends(validate_excel_file)
):
    """
    Procesar archivo de ventas y generar asientos contables para Concar
    """
    try:
        # Crear directorio de uploads si no existe
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        # Guardar archivo temporal
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        input_filename = f"ventas_{timestamp}_{archivo.filename}"
        input_path = os.path.join(settings.UPLOAD_DIR, input_filename)

        with open(input_path, "wb") as f:
            content = await archivo.read()
            f.write(content)

        # Obtener diccionarios activos de la base de datos
        productos_cuentas = db.query(ProductoCuenta).filter(ProductoCuenta.activo == True).all()
        combos_salto = db.query(ComboSalto).filter(ComboSalto.activo == True).all()

        diccionario_cuentas = {pc.producto: pc.cuenta_contable for pc in productos_cuentas}
        diccionario_combos = {cs.combo: cs.salto for cs in combos_salto}

        # Procesar archivo
        servicio = ProcesamientoService(diccionario_cuentas, diccionario_combos)
        df_resultado, codigos_faltantes = servicio.procesar_archivo_ventas(
            input_path,
            mes,
            subdiario_inicial,
            numero_comprobante_inicial
        )

        # Guardar resultado
        output_filename = f"asientos_{timestamp}.xlsx"
        output_path = os.path.join(settings.UPLOAD_DIR, output_filename)
        df_resultado.to_excel(output_path, index=False)

        # Guardar en historial
        historial = ProcesamientoHistorial(
            nombre_archivo=archivo.filename,
            mes=mes,
            subdiario_inicial=subdiario_inicial,
            numero_comprobante_inicial=numero_comprobante_inicial,
            total_registros_procesados=len(df_resultado),
            total_asientos_generados=len(df_resultado),
            codigos_faltantes=json.dumps(codigos_faltantes, ensure_ascii=False) if codigos_faltantes else None,
            archivo_salida=output_filename,
            estado="completado",
            procesado_por=current_user.email
        )
        db.add(historial)
        db.commit()
        db.refresh(historial)

        # Limpiar archivo temporal de entrada
        if os.path.exists(input_path):
            os.remove(input_path)

        return schemas.ProcesamientoResponse(
            id=historial.id,
            nombre_archivo=archivo.filename,
            total_registros_procesados=len(df_resultado),
            total_asientos_generados=len(df_resultado),
            codigos_faltantes=codigos_faltantes,
            archivo_salida_url=f"/api/v1/procesamiento/descargar/{historial.id}",
            mensaje="Procesamiento completado exitosamente"
        )

    except Exception as e:
        # Guardar error en historial
        historial_error = ProcesamientoHistorial(
            nombre_archivo=archivo.filename,
            mes=mes,
            subdiario_inicial=subdiario_inicial,
            numero_comprobante_inicial=numero_comprobante_inicial,
            total_registros_procesados=0,
            total_asientos_generados=0,
            estado="error",
            mensaje_error=str(e),
            procesado_por=current_user.email if current_user else None
        )
        db.add(historial_error)
        db.commit()

        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")


@router.get("/descargar/{historial_id}")
async def descargar_archivo_procesado(
    historial_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Descargar archivo procesado
    """
    from fastapi.responses import FileResponse

    historial = db.query(ProcesamientoHistorial).filter(
        ProcesamientoHistorial.id == historial_id
    ).first()

    if not historial:
        raise HTTPException(status_code=404, detail="Historial no encontrado")

    if not historial.archivo_salida:
        raise HTTPException(status_code=404, detail="Archivo de salida no disponible")

    archivo_path = os.path.join(settings.UPLOAD_DIR, historial.archivo_salida)

    if not os.path.exists(archivo_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor")

    return FileResponse(
        path=archivo_path,
        filename=historial.archivo_salida,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
