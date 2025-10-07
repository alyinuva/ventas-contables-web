import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { procesamientoApi } from '@/lib/api'

export function Procesar() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [mes, setMes] = useState('')
  const [subdiario, setSubdiario] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState('')

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

    try {
      const result = await procesamientoApi.procesar(archivo, {
        mes,
        subdiario_inicial: parseInt(subdiario),
        numero_comprobante_inicial: parseInt(comprobante),
      })
      setResultado(result)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const handleDescargar = () => {
    if (resultado) {
      window.open(procesamientoApi.descargar(resultado.id), '_blank')
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

            {resultado.codigos_faltantes.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Productos sin mapeo ({resultado.codigos_faltantes.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {resultado.codigos_faltantes.slice(0, 10).map((codigo: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs bg-yellow-100 px-2 py-1 rounded border border-yellow-300"
                    >
                      {codigo}
                    </span>
                  ))}
                  {resultado.codigos_faltantes.length > 10 && (
                    <span className="text-xs text-yellow-700">
                      +{resultado.codigos_faltantes.length - 10} más
                    </span>
                  )}
                </div>
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
