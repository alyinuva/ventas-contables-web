import { Link } from 'react-router-dom'
import { FileText, Settings, History, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido</h1>
        <p className="text-gray-600 mt-1">
          Sistema de conversión de reportes de ventas a asientos contables para Concar
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Registrados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,721</div>
            <p className="text-xs text-muted-foreground">En diccionario de cuentas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combos Configurados</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Reglas de salto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesamientos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Procesar Archivo de Ventas
            </CardTitle>
            <CardDescription>
              Convierte reportes de ventas a asientos contables para Concar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/procesar">
              <Button className="w-full">Ir a Procesamiento</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Gestionar Configuración
            </CardTitle>
            <CardDescription>
              Administra productos, cuentas contables y reglas de combos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/configuracion">
              <Button variant="outline" className="w-full">
                Ir a Configuración
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Ver Historial
            </CardTitle>
            <CardDescription>
              Revisa los procesamientos anteriores y descarga archivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/historial">
              <Button variant="outline" className="w-full">
                Ver Historial
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-primary">Cómo Funciona</CardTitle>
            <CardDescription>
              1. Selecciona el archivo de ventas Excel<br />
              2. Configura parámetros (mes, subdiario, comprobante)<br />
              3. Procesa y descarga el archivo para Concar
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
