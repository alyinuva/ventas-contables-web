"""
Servicio de procesamiento de archivos de ventas a asientos contables
Migrado de la función process_files() original
"""
import pandas as pd
from typing import Dict, List, Tuple, Set
from app.utils.excel_reader import read_excel_file


class ProcesamientoService:
    """
    Servicio para procesar archivos de ventas y generar asientos contables para Concar
    """

    def __init__(self, diccionario_cuentas: Dict[str, str], diccionario_combos: Dict[str, int]):
        self.diccionario_cuentas = diccionario_cuentas
        self.diccionario_combos = diccionario_combos
        self.missing_codes: Set[str] = set()

    @staticmethod
    def get_DNIRUC_name(df: pd.DataFrame, i: int) -> Tuple[str, str]:
        """Extraer DNI/RUC y nombre del cliente"""
        dniruc = str(df.iloc[i, 6]).strip()
        cliente = str(df.iloc[i, 5]).strip()
        if dniruc in ["00000000", " 00000000"]:
            return "00000000", "Clientes Varios"
        else:
            return dniruc, cliente

    @staticmethod
    def tipo_doc_func(serie: str) -> str:
        """Determinar tipo de documento según serie"""
        if len(serie) > 0 and serie[0] in ["B", "b"]:
            return "BV"
        elif len(serie) > 0 and serie[0] in ["F", "f"]:
            return "FT"
        else:
            return "NO RECONOCIDO"

    def procesar_archivo_ventas(
        self,
        archivo_ventas_path: str,
        mes: str,
        subdiario_inicial: int,
        num_comprobante_inicial: int
    ) -> Tuple[pd.DataFrame, List[str]]:
        """
        Procesa un archivo de ventas y genera los asientos contables

        Args:
            archivo_ventas_path: Ruta al archivo de ventas
            mes: Mes en formato '01', '02', etc.
            subdiario_inicial: Número inicial de subdiario
            num_comprobante_inicial: Número inicial de comprobante

        Returns:
            Tuple con DataFrame de asientos contables y lista de códigos faltantes
        """
        # Cargar archivo de ventas
        df = read_excel_file(archivo_ventas_path)

        # Nombres de columnas esperados (pueden variar entre archivos)
        expected_columns = [
            "Fecha", "Hora", "Mesa", "Caja", "Turno", "Cliente", "DNIRUC",
            "TipoDoc", "SerieDoc", "NumDoc", "PagosA", "PagosB", "Retencion", "Propina",
            "Subtotal", "IGV", "Impuestos", "Total", "Descuento", "Tipo", "Estado",
            "UsuarioAnulador", "PerfilAnulador", "UsuarioAprobador", "PerfilAprobador",
            "Motivo", "CanalVenta", "CanalDelivery", "RetornoStock", "UsuarioRegistrado", "PerfilRegistrador"
        ]

        # Asignar nombres de columnas dinámicamente según el número real de columnas
        num_cols = len(df.columns)
        if num_cols <= len(expected_columns):
            df.columns = expected_columns[:num_cols]
        else:
            # Si hay más columnas de las esperadas, agregar nombres genéricos
            df.columns = expected_columns + [f"Extra_{i}" for i in range(num_cols - len(expected_columns))]

        # Extracción de información
        info = []
        num_rows = df.shape[0]
        i = 0

        while i < num_rows:
            estado = str(df.iloc[i, 20]).strip()
            if estado in ["Activa", "Anulada"]:
                dniruc, nombre = self.get_DNIRUC_name(df, i)
                dniruc = dniruc[:40]
                nombre = nombre[:40]
                datos_boleta = {
                    "Fecha": df.iloc[i, 0],
                    "DNIRUC": dniruc,
                    "Cliente": nombre,
                    "Num": str(df.iloc[i, 8]),
                    "Serie": str(df.iloc[i, 9]),
                    "Total": df.iloc[i, 17],
                    "Estado": estado
                }

                # Buscar la fila que contenga "Detalle de venta"
                found = False
                for n in range(7):
                    if str(df.iloc[i + n, 0]).strip() == "Detalle de venta":
                        i_detalle = i + n + 2
                        found = True
                        break

                if not found:
                    i += 1
                    continue

                comida = []
                while True:
                    try:
                        value = pd.to_numeric(df.iloc[i_detalle, 5], errors='coerce')
                        if pd.isna(value):
                            break
                        if str(df.iloc[i_detalle, 2]).strip() == "N/N":
                            break
                    except:
                        break

                    producto = str(df.iloc[i_detalle, 2]).strip()
                    cantidad = df.iloc[i_detalle, 6]
                    cantidad = pd.to_numeric(cantidad, errors='coerce')
                    if pd.isna(cantidad):
                        break

                    if producto in ['Bolsa -', 'Bolsa']:
                        comida.append([producto, 0.5])
                        comida.append(['701112', cantidad])
                    else:
                        comida.append([producto, cantidad])

                    if producto in self.diccionario_combos:
                        salto = self.diccionario_combos[producto]
                        i_detalle += salto
                    else:
                        i_detalle += 1

                info.append([datos_boleta, comida])
            i += 1

        # Mapeo adicional (hardcodeado en original)
        dic8caracter18Caracter = {
            701112: '',
            401891: '4018',
            701211: '',
            702211: ''
        }

        # Construcción de los registros contables
        datos = []
        num_comprobante_int_local = int(num_comprobante_inicial) - 1
        subdiario_int_local = int(subdiario_inicial)

        for boleta in info:
            # Incrementar el contador
            num_comprobante_int_local += 1

            # Si pasa de 9999, subir subdiario y reiniciar el contador
            if num_comprobante_int_local > 9999:
                subdiario_int_local += 1
                num_comprobante_int_local = 1

            # Construir el NR. de comprobante (dos dígitos de mes + 4 de correlativo)
            num_comprobante_str = mes + str(num_comprobante_int_local).zfill(4)

            # Construir el subdiario (2 dígitos)
            sub_diario_str = str(subdiario_int_local).zfill(2)

            tipoDoc = self.tipo_doc_func(
                boleta[0]["Num"][-4:] if len(boleta[0]["Num"]) >= 4 else boleta[0]["Num"]
            )
            fecha = boleta[0]["Fecha"]

            if boleta[0]["Estado"].strip() == "Anulada":
                cliente = "ANULADO"
                datos.append([
                    sub_diario_str, num_comprobante_str, fecha, "MN", cliente, 0, "V", "S", "",
                    101101, '0001', '', 'D', boleta[0]["Total"], "", "", tipoDoc,
                    boleta[0]["Num"][-4:] + "-" + str(boleta[0]["Serie"]), fecha, fecha
                ])
            else:
                cliente = boleta[0]["Cliente"]
                if boleta[0]["DNIRUC"].strip() == "00000000":
                    codAnex = '99999'
                else:
                    codAnex = boleta[0]["DNIRUC"]

                # Asiento para la cuenta de cliente
                datos.append([
                    sub_diario_str, num_comprobante_str, fecha, "MN", cliente, 0, "V", "S", "",
                    101101, codAnex, '', 'D', boleta[0]["Total"], "", "", tipoDoc,
                    boleta[0]["Num"][-4:] + "-" + str(boleta[0]["Serie"]), fecha, fecha
                ])

                # Asientos para los productos vendidos
                for comida_costo in boleta[1]:
                    if comida_costo[0] not in self.diccionario_cuentas:
                        print("Código no encontrado en DiccionarioCuentas:", comida_costo[0])
                        self.missing_codes.add(comida_costo[0])
                    else:
                        caracter18 = self.diccionario_cuentas[comida_costo[0]]
                        try:
                            clave = int(caracter18) if str(caracter18).isdigit() else caracter18
                        except:
                            clave = caracter18
                        extra = dic8caracter18Caracter.get(clave, '')
                        datos.append([
                            sub_diario_str, num_comprobante_str, fecha, "MN", cliente, 0,
                            "V", "S", "", caracter18, extra, '', 'H', comida_costo[1],
                            "", "", tipoDoc,
                            boleta[0]["Num"][-4:] + "-" + str(boleta[0]["Serie"]), fecha, fecha
                        ])

        # Crear DataFrame
        contable = pd.DataFrame(datos)
        contable.columns = [
            "Sub Diario", "Numero de Comprobante", "Fecha", "Código de Moneda",
            "Glosa Principal", "Tipo de Cambio", "Tipo de Conversión", "Flag de Conversión de Moneda",
            "Fecha de Tipo de Cambio", "CuentaContable", "CodigoAnexo", "CodigoCentroCosto",
            "DebeHaber", "ImporteOriginal", "ImporteDolares", "ImporteSoles",
            "TipoDoc", "Nr.Doc", "FechaDoc", "FechaVenc"
        ]

        # Agrupar por Nr.Doc y CuentaContable
        grouped_df = contable.groupby(
            ["Nr.Doc", "CuentaContable"], as_index=False
        ).agg({
            "Sub Diario": 'first',
            "Numero de Comprobante": 'first',
            "Fecha": 'first',
            "Código de Moneda": 'first',
            "Glosa Principal": 'first',
            "Tipo de Cambio": 'first',
            "Tipo de Conversión": 'first',
            "Flag de Conversión de Moneda": 'first',
            'Fecha de Tipo de Cambio': 'first',
            "CodigoAnexo": "first",
            "CodigoCentroCosto": "first",
            "DebeHaber": "first",
            "ImporteOriginal": 'sum',
            "ImporteDolares": 'first',
            "ImporteSoles": 'first',
            "TipoDoc": 'first',
            "Nr.Doc": 'first',
            "FechaDoc": 'first',
            "FechaVenc": 'first'
        })

        grouped_df = grouped_df[[
            "Sub Diario", "Numero de Comprobante", "Fecha", "Código de Moneda",
            "Glosa Principal", "Tipo de Cambio", "Tipo de Conversión", "Flag de Conversión de Moneda",
            "Fecha de Tipo de Cambio", "CuentaContable", "CodigoAnexo", "CodigoCentroCosto",
            "DebeHaber", "ImporteOriginal", "ImporteDolares", "ImporteSoles",
            "TipoDoc", "Nr.Doc", "FechaDoc", "FechaVenc"
        ]]

        # Formatear fechas
        for col in ["Fecha", "FechaDoc", "FechaVenc"]:
            grouped_df[col] = pd.to_datetime(grouped_df[col], errors='coerce').dt.strftime('%d/%m/%Y')

        # Truncar Glosa Principal a 40 caracteres
        grouped_df["Glosa Principal"] = grouped_df["Glosa Principal"].astype(str).str[:40]

        # Ordenar
        grouped_df.sort_values(
            by=["Sub Diario", "Numero de Comprobante", "DebeHaber", "ImporteOriginal"],
            ascending=[True, True, True, False],
            inplace=True
        )

        return grouped_df, list(self.missing_codes)
