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
            import xlrd
            workbook = xlrd.open_workbook(file_path)
            df = pd.read_excel(workbook)
            return df
        except Exception as e:
            if "Expected BOF record" in str(e) or "<html" in str(e).lower():
                try:
                    with open(file_path, "rb") as f:
                        header = f.read(100).lower()
                    if b"<html" in header:
                        df_list = pd.read_html(file_path, flavor='lxml')
                        if df_list:
                            return df_list[0]
                        else:
                            raise Exception("No se encontró ninguna tabla HTML en el archivo")
                    else:
                        raise Exception(f"Error al leer el archivo {file_path} con xlrd: {e}")
                except Exception as e_html:
                    raise Exception(f"Error al leer el archivo {file_path} como HTML: {e_html}")
            else:
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
