import { useState, useEffect } from 'react'
import { Upload, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { productosApi, combosApi } from '@/lib/api'
import type { ProductoCuenta, ComboSalto } from '@/types'

export function Configuracion() {
  const [activeTab, setActiveTab] = useState<'productos' | 'combos'>('productos')
  const [productos, setProductos] = useState<ProductoCuenta[]>([])
  const [combos, setCombos] = useState<ComboSalto[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Nuevo producto/combo
  const [nuevoProducto, setNuevoProducto] = useState('')
  const [nuevaCuenta, setNuevaCuenta] = useState('')
  const [nuevoCombo, setNuevoCombo] = useState('')
  const [nuevoSalto, setNuevoSalto] = useState('')

  // Carga inicial
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [prods, cmbs] = await Promise.all([productosApi.getAll(true), combosApi.getAll(true)])
      setProductos(prods)
      setCombos(cmbs)
    } catch (error) {
      console.error('Error cargando datos:', error)
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

  const handleAgregarCombo = async () => {
    if (!nuevoCombo || !nuevoSalto) return
    try {
      await combosApi.create({ combo: nuevoCombo, salto: parseInt(nuevoSalto) })
      setNuevoCombo('')
      setNuevoSalto('')
      cargarDatos()
    } catch (error) {
      console.error('Error agregando combo:', error)
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

  const handleEliminarCombo = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este combo?')) {
      try {
        await combosApi.delete(id)
        cargarDatos()
      } catch (error) {
        console.error('Error eliminando combo:', error)
      }
    }
  }

  const handleImportarProductos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await productosApi.importar(file)
      cargarDatos()
      alert(result.message || 'Productos importados exitosamente')
    } catch (error: any) {
      console.error('Error importando productos:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido al importar productos'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleImportarCombos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await combosApi.importar(file)
      cargarDatos()
      alert(result.message || 'Combos importados exitosamente')
    } catch (error: any) {
      console.error('Error importando combos:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido al importar combos'
      alert(`Error: ${errorMessage}`)
    }
  }

  const productosFiltrados = productos.filter(
    (p) =>
      p.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cuenta_contable.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const combosFiltrados = combos.filter((c) =>
    c.combo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">Gestiona productos, cuentas contables y combos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('productos')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'productos'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Productos y Cuentas ({productos.length})
        </button>
        <button
          onClick={() => setActiveTab('combos')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'combos'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Combos ({combos.length})
        </button>
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {/* Productos Tab */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          {/* Importar */}
          <Card>
            <CardHeader>
              <CardTitle>Importar Productos desde Excel</CardTitle>
              <CardDescription>
                Carga un archivo con columnas: Producto, Asiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label htmlFor="import-productos">
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleImportarProductos}
                  className="hidden"
                  id="import-productos"
                />
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Agregar Nuevo */}
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

          {/* Tabla */}
          <Card>
            <CardHeader>
              <CardTitle>Productos ({productosFiltrados.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Cuenta Contable
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
      )}

      {/* Combos Tab */}
      {activeTab === 'combos' && (
        <div className="space-y-6">
          {/* Importar */}
          <Card>
            <CardHeader>
              <CardTitle>Importar Combos desde Excel</CardTitle>
              <CardDescription>Carga un archivo con columnas: Combo, Salto</CardDescription>
            </CardHeader>
            <CardContent>
              <label htmlFor="import-combos">
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleImportarCombos}
                  className="hidden"
                  id="import-combos"
                />
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Agregar Nuevo */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Combo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Combo</Label>
                  <Input
                    value={nuevoCombo}
                    onChange={(e) => setNuevoCombo(e.target.value)}
                    placeholder="Nombre del combo"
                  />
                </div>
                <div className="w-32">
                  <Label>Salto</Label>
                  <Input
                    type="number"
                    value={nuevoSalto}
                    onChange={(e) => setNuevoSalto(e.target.value)}
                    placeholder="4"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAgregarCombo}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla */}
          <Card>
            <CardHeader>
              <CardTitle>Combos ({combosFiltrados.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Combo
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Salto
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {combosFiltrados.map((combo) => (
                      <tr key={combo.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{combo.combo}</td>
                        <td className="px-4 py-3 text-sm font-mono">{combo.salto}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarCombo(combo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
