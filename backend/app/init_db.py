"""
Script para inicializar la base de datos con datos iniciales
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import ProductoCuenta, ComboSalto, Usuario
from app.core.security import get_password_hash
from app.utils.excel_reader import read_excel_file
import os


def init_db():
    """Inicializar base de datos"""
    # Crear tablas
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Crear usuario admin por defecto
        admin_exists = db.query(Usuario).filter(Usuario.email == "admin@ventas.com").first()
        if not admin_exists:
            admin = Usuario(
                email="admin@ventas.com",
                nombre="Administrador",
                hashed_password=get_password_hash("admin123"),
                activo=True,
                es_admin=True
            )
            db.add(admin)
            print("✓ Usuario admin creado (email: admin@ventas.com, password: admin123)")

        # Importar DiccionarioCuentas2 si existe el archivo
        diccionario_path = "../DiccionarioCuentas2.xlsx"
        if os.path.exists(diccionario_path):
            print(f"Importando productos desde {diccionario_path}...")
            df = read_excel_file(diccionario_path)

            count = 0
            for _, row in df.iterrows():
                producto = str(row['Producto']).strip()
                cuenta = str(row['Asiento']).strip()

                existe = db.query(ProductoCuenta).filter(
                    ProductoCuenta.producto == producto
                ).first()

                if not existe:
                    nuevo = ProductoCuenta(
                        producto=producto,
                        cuenta_contable=cuenta,
                        activo=True
                    )
                    db.add(nuevo)
                    count += 1

            print(f"✓ {count} productos importados")

        # Importar ComboSalto si existe el archivo
        combo_path = "../ComboSalto.xlsx"
        if os.path.exists(combo_path):
            print(f"Importando combos desde {combo_path}...")
            df = read_excel_file(combo_path)

            count = 0
            for _, row in df.iterrows():
                combo = str(row['Combo']).strip()
                salto = int(row['Salto'])

                existe = db.query(ComboSalto).filter(ComboSalto.combo == combo).first()

                if not existe:
                    nuevo = ComboSalto(combo=combo, salto=salto, activo=True)
                    db.add(nuevo)
                    count += 1

            print(f"✓ {count} combos importados")

        db.commit()
        print("\n✅ Base de datos inicializada correctamente")

    except Exception as e:
        print(f"\n❌ Error al inicializar base de datos: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
