"""
Script de inicialización de la base de datos
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import Usuario
from app.core.security import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db() -> None:
    """
    Inicializar base de datos y crear usuario admin por defecto
    """
    try:
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas creadas exitosamente")

        # Crear sesión
        db: Session = SessionLocal()

        try:
            # Verificar si ya existe el usuario admin
            admin_exists = db.query(Usuario).filter(Usuario.email == "admin@ventas.com").first()

            if not admin_exists:
                # Crear usuario admin por defecto
                admin_user = Usuario(
                    email="admin@ventas.com",
                    nombre="Administrador",
                    hashed_password=get_password_hash("admin123"),
                    activo=True,
                    es_admin=True
                )
                db.add(admin_user)
                db.commit()
                logger.info("Usuario admin creado: admin@ventas.com / admin123")
            else:
                logger.info("Usuario admin ya existe")

        finally:
            db.close()

    except Exception as e:
        logger.error(f"Error inicializando base de datos: {e}")
        raise
