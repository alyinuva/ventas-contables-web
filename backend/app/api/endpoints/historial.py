"""
Endpoints para historial de procesamientos
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.api import schemas
from app.models.models import ProcesamientoHistorial, Usuario

router = APIRouter()


@router.get("/", response_model=List[schemas.HistorialItem])
def listar_historial(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener historial de procesamientos
    """
    historial = db.query(ProcesamientoHistorial).order_by(
        ProcesamientoHistorial.created_at.desc()
    ).offset(skip).limit(limit).all()

    return historial


@router.get("/{historial_id}", response_model=schemas.HistorialItem)
def obtener_historial_detalle(
    historial_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener detalle de un procesamiento
    """
    historial = db.query(ProcesamientoHistorial).filter(
        ProcesamientoHistorial.id == historial_id
    ).first()

    if not historial:
        raise HTTPException(status_code=404, detail="Historial no encontrado")

    return historial


@router.delete("/{historial_id}", response_model=schemas.Message)
def eliminar_historial(
    historial_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Eliminar registro de historial
    """
    historial = db.query(ProcesamientoHistorial).filter(
        ProcesamientoHistorial.id == historial_id
    ).first()

    if not historial:
        raise HTTPException(status_code=404, detail="Historial no encontrado")

    db.delete(historial)
    db.commit()

    return schemas.Message(message="Historial eliminado exitosamente")
