"""
Endpoints para autenticación
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api import schemas
from app.api.deps import get_current_user
from app.models.models import Usuario

router = APIRouter()


@router.post("/registro", response_model=schemas.Usuario)
def registro_usuario(
    usuario: schemas.UsuarioCreate,
    db: Session = Depends(get_db)
):
    """
    Registrar nuevo usuario
    """
    # Verificar si el email ya existe
    existe = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Crear usuario
    hashed_password = get_password_hash(usuario.password)
    db_usuario = Usuario(
        email=usuario.email,
        nombre=usuario.nombre,
        hashed_password=hashed_password,
        activo=True,
        es_admin=False
    )

    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)

    return db_usuario


@router.post("/login", response_model=schemas.Token)
def login(
    credentials: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Iniciar sesión y obtener token de acceso
    """
    # Buscar usuario
    usuario = db.query(Usuario).filter(Usuario.email == credentials.email).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )

    # Verificar contraseña
    if not verify_password(credentials.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )

    # Verificar si está activo
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )

    # Crear token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": usuario.email},
        expires_delta=access_token_expires
    )

    return schemas.Token(access_token=access_token, token_type="bearer")


@router.get("/yo", response_model=schemas.Usuario)
def obtener_usuario_actual(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener información del usuario actual
    """
    return current_user
