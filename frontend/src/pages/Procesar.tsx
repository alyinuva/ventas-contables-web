import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, AlertCircle, CheckCircle2, Save, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { procesamientoApi, productosApi } from '@/lib/api'

interface ProductoMapeo {
  producto: string
  cuenta_contable: string
}

export function Procesar() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [mes, setMes] = useState('')
  const [subdiario, setSubdiario] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState('')

  // Estados para mapeo de productos
  const [mapeos, setMapeos] = useState<ProductoMapeo[]>([])
  const [mapeosExpandido, setMapeosExpandido] = useState(true)
  const [guardandoMapeos, setGuardandoMapeos] = useState(false)
  const [reprocesando, setReprocesando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setArchivo(acceptedFiles[0])
      setError('')
      setResultado(null)
      setMapeos([])
      setMensajeExito('')
    },
  })

  const handleProcesar = async () => {
    if (!archivo) {
      setError('Debes seleccionar un archivo')
      return
    }

    if (!mes || !subdiario || !comprobante) {
      setError('Debes completar todos los campos')
      return
    }

    setLoading(true)
    setError('')
    setResultado(null)
    setMensajeExito('')

    try {
      const result = await procesamientoApi.procesar(archivo, {
        mes,
        subdiario_inicial: parseInt(subdiario),
        numero_comprobante_inicial: parseInt(comprobante),
      })
      setResultado(result)

      // Inicializar mapeos si hay códigos faltantes
      if (result.codigos_faltantes && result.codigos_faltantes.length > 0) {
        const nuevosMapeos = result.codigos_faltantes.map((codigo: string) => ({
          producto: codigo,
          cuenta_contable: ''
        }))
        setMapeos(nuevosMapeos)
        setMapeosExpandido(true)
      } else {
        setMapeos([])
      }
    } catch (err: any) {
      // Manejar errores de validación de Pydantic (422)
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail
        if (Array.isArray(detail)) {
          // Error de validación de Pydantic
          const errorMessages = detail.map((e: any) => e.msg).join(', ')
          setError(errorMessages)
        } else if (typeof detail === 'string') {
          // Error simple
          setError(detail)
        } else {
          setError('Error al procesar el archivo')
        }
      } else {
        setError('Error al procesar el archivo')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDescargar = async () => {
    if (resultado) {
      try {
        await procesamientoApi.descargar(resultado.id, resultado.nombre_archivo)
      } catch (err) {
        console.error('Error descargando archivo:', err)
        setError('Error al descargar el archivo')
      }
    }
  }

  // Actualizar cuenta contable de un mapeo específico
  const handleUpdateMapeo = (index: number, cuentaContable: string) => {
    const nuevosMapeos = [...mapeos]
    nuevosMapeos[index].cuenta_contable = cuentaContable
    setMapeos(nuevosMapeos)
  }

  // Eliminar un mapeo de la lista
  const handleEliminarMapeo = (index: number) => {
    const nuevosMapeos = mapeos.filter((_, i) => i !== index)
    setMapeos(nuevosMapeos)
  }

  // Guardar mapeos en la base de datos
  const handleGuardarMapeos = async () => {
    // Validar que todos los mapeos tengan cuenta contable
    const mapeosIncompletos = mapeos.filter(m => !m.cuenta_contable.trim())
    if (mapeosIncompletos.length > 0) {
      setError(`Completa la cuenta contable para todos los productos (${mapeosIncompletos.length} faltantes)`)
      return
    }

    setGuardandoMapeos(true)
    setError('')
    setMensajeExito('')

    try {
      // Guardar cada mapeo
      const promesas = mapeos.map(mapeo =>
        productosApi.create({
          producto: mapeo.producto,
          cuenta_contable: mapeo.cuenta_contable,
          activo: true
        })
      )

      await Promise.all(promesas)
      setMensajeExito(`${mapeos.length} productos guardados exitosamente`)
    } catch (err: any) {
      console.error('Error guardando mapeos:', err)
      setError('Error al guardar los mapeos. Algunos productos ya pueden existir.')
    } finally {
      setGuardandoMapeos(false)
    }
  }

  // Guardar mapeos y reprocesar automáticamente
  const handleGuardarYReprocesar = async () => {
    // Validar que todos los mapeos tengan cuenta contable
    const mapeosIncompletos = mapeos.filter(m => !m.cuenta_contable.trim())
    if (mapeosIncompletos.length > 0) {
      setError(`Completa la cuenta contable para todos los productos (${mapeosIncompletos.length} faltantes)`)
      return
    }

    if (!archivo) {
      setError('No hay archivo para reprocesar')
      return
    }

    setGuardandoMapeos(true)
    setReprocesando(true)
    setError('')
    setMensajeExito('')

    try {
      // 1. Guardar mapeos
      const promesas = mapeos.map(mapeo =>
        productosApi.create({
          producto: mapeo.producto,
          cuenta_contable: mapeo.cuenta_contable,
          activo: true
        })
      )
      await Promise.all(promesas)
      setMensajeExito(`${mapeos.length} productos guardados exitosamente`)

      // 2. Reprocesar archivo con los nuevos mapeos
      const result = await procesamientoApi.procesar(archivo, {
        mes,
        subdiario_inicial: parseInt(subdiario),
        numero_comprobante_inicial: parseInt(comprobante),
      })

      setResultado(result)

      // 3. Actualizar mapeos si aún hay códigos faltantes
      if (result.codigos_faltantes && result.codigos_faltantes.length > 0) {
        const nuevosMapeos = result.codigos_faltantes.map((codigo: string) => ({
          producto: codigo,
          cuenta_contable: ''
        }))
        setMapeos(nuevosMapeos)
        setMensajeExito(`Archivo reprocesado. Aún quedan ${result.codigos_faltantes.length} productos sin mapeo.`)
      } else {
        setMapeos([])
        setMensajeExito('¡Archivo procesado completamente! Todos los productos están mapeados.')
        setMapeosExpandido(false)
      }
    } catch (err: any) {
      console.error('Error en guardar y reprocesar:', err)
      setError('Error al guardar o reprocesar. Revisa los datos ingresados.')
    } finally {
      setGuardandoMapeos(false)
      setReprocesando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Procesar Archivo de Ventas</h1>
        <p className="text-gray-600 mt-1">
          Convierte reportes de ventas a asientos contables para Concar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>1. Seleccionar Archivo</CardTitle>
            <CardDescription>Arrastra o selecciona el archivo de ventas Excel</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              {archivo ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{archivo.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(archivo.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? 'Suelta el archivo aquí'
                      : 'Arrastra el archivo o haz clic para seleccionar'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Formatos: .xls, .xlsx</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Parameters Section */}
        <Card>
          <CardHeader>
            <CardTitle>2. Configurar Parámetros</CardTitle>
            <CardDescription>Ingresa los valores de configuración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mes (01-12)</Label>
              <Input
                id="mes"
                type="text"
                placeholder="08"
                maxLength={2}
                value={mes}
                onChange={(e) => setMes(e.target.value.replace(/\D/g, '').slice(0, 2))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdiario">Subdiario Inicial</Label>
              <Input
                id="subdiario"
                type="number"
                placeholder="1"
                min="1"
                value={subdiario}
                onChange={(e) => setSubdiario(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comprobante">Número de Comprobante Inicial</Label>
              <Input
                id="comprobante"
                type="number"
                placeholder="1"
                min="1"
                max="9999"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
              />
            </div>

            <Button
              onClick={handleProcesar}
              disabled={loading || !archivo}
              className="w-full mt-4"
            >
              {loading ? 'Procesando...' : 'Procesar Archivo'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive">Error en el procesamiento</h3>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {mensajeExito && (
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-600">Operación exitosa</h3>
                <p className="text-sm text-green-600/80 mt-1">{mensajeExito}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Result */}
      {resultado && (
        <Card className="border-green-500/50 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-6 w-6" />
              Procesamiento Completado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Archivo procesado</p>
                <p className="font-medium">{resultado.nombre_archivo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registros procesados</p>
                <p className="font-medium">{resultado.total_registros_procesados}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Asientos generados</p>
                <p className="font-medium">{resultado.total_asientos_generados}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Códigos faltantes</p>
                <p className="font-medium">{resultado.codigos_faltantes.length}</p>
              </div>
            </div>

            {mapeos.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md overflow-hidden">
                {/* Header colapsable */}
                <button
                  onClick={() => setMapeosExpandido(!mapeosExpandido)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-700" />
                    <p className="text-sm font-medium text-yellow-800">
                      Productos sin mapeo ({mapeos.length}) - Haz clic para {mapeosExpandido ? 'ocultar' : 'mapear'}
                    </p>
                  </div>
                  {mapeosExpandido ? (
                    <ChevronUp className="h-5 w-5 text-yellow-700" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-yellow-700" />
                  )}
                </button>

                {/* Tabla de mapeos */}
                {mapeosExpandido && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-yellow-800">
                        Completa la cuenta contable para cada producto y luego guarda los mapeos para reprocesar el archivo.
                      </p>
                      <p className="text-xs text-yellow-700 font-medium">
                        {mapeos.filter(m => m.cuenta_contable.trim()).length} de {mapeos.length} completos
                      </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto border border-yellow-300 rounded-md">
                      <table className="w-full">
                        <thead className="bg-yellow-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-yellow-900">
                              Producto
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-yellow-900">
                              Cuenta Contable
                            </th>
                            <th className="px-4 py-2 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-yellow-200">
                          {mapeos.map((mapeo, index) => (
                            <tr key={index} className="hover:bg-yellow-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {mapeo.producto}
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="text"
                                  value={mapeo.cuenta_contable}
                                  onChange={(e) => handleUpdateMapeo(index, e.target.value)}
                                  placeholder="702211"
                                  className={`w-full ${
                                    mapeo.cuenta_contable.trim()
                                      ? 'border-green-500 focus:border-green-600'
                                      : 'border-yellow-400'
                                  }`}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEliminarMapeo(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleGuardarMapeos}
                        disabled={guardandoMapeos || reprocesando}
                        variant="outline"
                        className="flex-1"
                      >
                        {guardandoMapeos && !reprocesando ? (
                          <>
                            <Save className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Solo Guardar Mapeos
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleGuardarYReprocesar}
                        disabled={guardandoMapeos || reprocesando}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      >
                        {reprocesando ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Reprocesando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Guardar y Reprocesar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleDescargar} className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Descargar Archivo Excel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
