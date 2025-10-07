import { useState, useEffect } from 'react'
import { Download, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { historialApi, procesamientoApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { HistorialItem } from '@/types'

export function Historial() {
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async () => {
    setLoading(true)
    try {
      const data = await historialApi.getAll()
      setHistorial(data)
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await historialApi.delete(id)
        cargarHistorial()
      } catch (error) {
        console.error('Error eliminando registro:', error)
      }
    }
  }

  const handleDescargar = async (item: HistorialItem) => {
    try {
      await procesamientoApi.descargar(item.id, item.nombre_archivo)
    } catch (error) {
      console.error('Error descargando archivo:', error)
      alert('Error al descargar el archivo')
    }
  }

  const getEstadoBadge = (estado: string) => {
    if (estado === 'completado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3" />
          Completado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3" />
        Error
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Procesamientos</h1>
          <p className="text-gray-600 mt-1">Revisa y descarga archivos procesados anteriormente</p>
        </div>
        <Button onClick={cargarHistorial} variant="outline">
          Actualizar
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">Cargando historial...</p>
          </CardContent>
        </Card>
      ) : historial.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay procesamientos en el historial</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {historial.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.nombre_archivo}</CardTitle>
                    <CardDescription>{formatDate(item.created_at)}</CardDescription>
                  </div>
                  {getEstadoBadge(item.estado)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Mes</p>
                    <p className="font-medium">{item.mes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subdiario Inicial</p>
                    <p className="font-medium">{item.subdiario_inicial}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Comprobante Inicial</p>
                    <p className="font-medium">{item.numero_comprobante_inicial}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Asientos Generados</p>
                    <p className="font-medium">{item.total_asientos_generados}</p>
                  </div>
                </div>

                {item.codigos_faltantes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Códigos faltantes:</strong>{' '}
                      {JSON.parse(item.codigos_faltantes).length} productos sin mapeo
                    </p>
                  </div>
                )}

                {item.mensaje_error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {item.mensaje_error}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {item.estado === 'completado' && (
                    <Button onClick={() => handleDescargar(item)} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Excel
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEliminar(item.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>

                {item.procesado_por && (
                  <p className="text-xs text-gray-500 mt-2">Procesado por: {item.procesado_por}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
