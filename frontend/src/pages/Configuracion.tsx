import { useState, useEffect, type ChangeEvent } from 'react'
import { Upload, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { productosApi } from '@/lib/api'
import type { ProductoCuenta } from '@/types'

type SortField = 'nombre' | 'fecha'
type SortDirection = 'asc' | 'desc' | null

export function Configuracion() {
  const [productos, setProductos] = useState<ProductoCuenta[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const [nuevoProducto, setNuevoProducto] = useState('')
  const [nuevaCuenta, setNuevaCuenta] = useState('')
  const [importandoProductos, setImportandoProductos] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const prods = await productosApi.getAll(true)
      setProductos(prods)
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }

  const handleAgregarProducto = async () => {
    if (!nuevoProducto || !nuevaCuenta) return

    try {
      await productosApi.create({ producto: nuevoProducto, cuenta_contable: nuevaCuenta })
      setNuevoProducto('')
      setNuevaCuenta('')
      cargarDatos()
    } catch (error) {
      console.error('Error agregando producto:', error)
    }
  }

  const handleEliminarProducto = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productosApi.delete(id)
        cargarDatos()
      } catch (error) {
        console.error('Error eliminando producto:', error)
      }
    }
  }

  const handleImportarProductos = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportandoProductos(true)
    try {
      const result = await productosApi.importar(file)
      await cargarDatos()
      alert(result.message || 'Productos importados exitosamente')
    } catch (error: any) {
      console.error('Error importando productos:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido al importar productos'
      alert(`Error: ${errorMessage}`)
    } finally {
      setImportandoProductos(false)
      e.target.value = ''
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1 inline text-primary" />
    }
    return <ArrowDown className="h-4 w-4 ml-1 inline text-primary" />
  }

  const sortProductos = (items: ProductoCuenta[]): ProductoCuenta[] => {
    if (!sortField || !sortDirection) return items

    return [...items].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      if (sortField === 'nombre') {
        aValue = a.producto.toLowerCase()
        bValue = b.producto.toLowerCase()
      } else {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const productosFiltrados = sortProductos(
    productos.filter(
      (p) =>
        p.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cuenta_contable.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">Gestiona productos y cuentas contables</p>
      </div>

      <Input
        type="text"
        placeholder="Buscar producto o cuenta..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar Productos desde Excel</CardTitle>
            <CardDescription>Carga un archivo con columnas: Producto, Asiento</CardDescription>
          </CardHeader>
          <CardContent>
            <label htmlFor="import-productos">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleImportarProductos}
                className="hidden"
                id="import-productos"
                disabled={importandoProductos}
              />
              <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${importandoProductos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <Upload className={`h-4 w-4 mr-2 ${importandoProductos ? 'animate-spin' : ''}`} />
                {importandoProductos ? 'Importando...' : 'Seleccionar Archivo'}
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agregar Nuevo Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Producto</Label>
                <Input
                  value={nuevoProducto}
                  onChange={(e) => setNuevoProducto(e.target.value)}
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="flex-1">
                <Label>Cuenta Contable</Label>
                <Input
                  value={nuevaCuenta}
                  onChange={(e) => setNuevaCuenta(e.target.value)}
                  placeholder="702211"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAgregarProducto}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos ({productosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('nombre')}
                    >
                      Producto
                      {getSortIcon('nombre')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Cuenta Contable
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('fecha')}
                    >
                      Fecha Creación
                      {getSortIcon('fecha')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productosFiltrados.slice(0, 50).map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{producto.producto}</td>
                      <td className="px-4 py-3 text-sm font-mono">{producto.cuenta_contable}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(producto.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarProducto(producto.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productosFiltrados.length > 50 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Mostrando 50 de {productosFiltrados.length} productos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
