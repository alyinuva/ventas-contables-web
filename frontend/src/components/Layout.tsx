import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FileText, Settings, History, LogOut, Home } from 'lucide-react'
import { authApi } from '@/lib/api'
import { Button } from './ui/Button'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    authApi.logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ventas Contables</h1>
              <p className="text-xs text-gray-500">Conversión para Concar</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
            <Link to="/">
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive('/')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Inicio</span>
              </button>
            </Link>

            <Link to="/procesar">
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive('/procesar')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Procesar</span>
              </button>
            </Link>

            <Link to="/configuracion">
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive('/configuracion')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Configuración</span>
              </button>
            </Link>

            <Link to="/historial">
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive('/historial')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <History className="h-5 w-5" />
                <span className="font-medium">Historial</span>
              </button>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
