"""
Utilidades para leer archivos Excel
Migrado de la función read_excel_file() original
"""
import os
import pandas as pd


def read_excel_file(file_path: str) -> pd.DataFrame:
    """
    Lee el archivo utilizando el motor adecuado según la extensión.
    Para archivos .xls:
      - Se intenta primero con xlrd.
      - Si falla por error de BOF (por ejemplo, cuando el archivo contiene HTML),
        se intenta leer mediante pd.read_html (usando flavor='lxml') sin convertir a string.
    Para archivos .xlsx se utiliza openpyxl.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.xls':
        try:
            return pd.read_excel(file_path, engine='xlrd')
        except Exception as e:
            error_message = str(e)
            if "Expected BOF record" in error_message or "<html" in error_message.lower():
                try:
                    with open(file_path, "rb") as f:
                        header = f.read(512).lower()
                    if b"<html" in header:
                        df_list = pd.read_html(file_path, flavor='lxml')
                        if df_list:
                            return df_list[0]
                        raise Exception("No se encontró ninguna tabla HTML en el archivo")
                    raise Exception(f"Error al leer el archivo {file_path} con xlrd: {e}")
                except Exception as e_html:
                    raise Exception(f"Error al leer el archivo {file_path} como HTML: {e_html}")
            raise Exception(f"Error al leer el archivo {file_path} con xlrd: {e}")

    elif ext == '.xlsx':
        try:
            df = pd.read_excel(file_path, engine='openpyxl')
            return df
        except Exception as e:
            raise Exception(f"Error al leer el archivo {file_path} con engine=openpyxl: {e}")
    else:
        try:
            df = pd.read_excel(file_path)
            return df
        except Exception as e:
            raise Exception(f"Error al leer el archivo {file_path}: {e}")
