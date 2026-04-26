import { Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuthContext } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import LoginPage from '@/features/login/LoginPage'
import RegisterPage from '@/features/register/RegisterPage'
import ProyectosPage from '@/features/proyectos/ProyectosPage'
import ProyectoDetailPage from '@/features/proyectos/ProyectoDetailPage'
import ProductosPage from '@/features/productos/ProductosPage'
import ProductoDetailPage from '@/features/productos/ProductoDetailPage'
import TablasPage from '@/features/tablas/TablasPage'
import TablaDetailPage from '@/features/tablas/TablaDetailPage'
import BasesDeDatosPage from '@/features/bases_de_datos/BasesDeDatosPage'
import BaseDeDatosDetailPage from '@/features/bases_de_datos/BaseDeDatosDetailPage'
import InstrumentosPage from '@/features/instrumentos/InstrumentosPage'
import InstrumentoDetailPage from '@/features/instrumentos/InstrumentoDetailPage'
import UrlsPage from '@/features/urls/UrlsPage'
import UrlDetailPage from '@/features/urls/UrlDetailPage'
import ArchivosPage from '@/features/archivos/ArchivosPage'
import ArchivoDetailPage from '@/features/archivos/ArchivoDetailPage'
import UsersPage from '@/features/users/UsersPage'
import EntidadesPage from '@/features/entidades/EntidadesPage'
import HomePage from '@/features/home/HomePage'

function CatalogRoutes() {
  const { user, canManageUsers, logout } = useAuthContext()

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="proyectos" element={<ProyectosPage />} />
        <Route path="proyectos/:id" element={<ProyectoDetailPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="productos/:id" element={<ProductoDetailPage />} />
        <Route path="tablas" element={<TablasPage />} />
        <Route path="tablas/:id" element={<TablaDetailPage />} />
        <Route path="bases-de-datos" element={<BasesDeDatosPage />} />
        <Route path="bases-de-datos/:id" element={<BaseDeDatosDetailPage />} />
        <Route path="instrumentos" element={<InstrumentosPage />} />
        <Route path="instrumentos/:id" element={<InstrumentoDetailPage />} />
        <Route path="urls" element={<UrlsPage />} />
        <Route path="urls/:id" element={<UrlDetailPage />} />
        <Route path="archivos" element={<ArchivosPage />} />
        <Route path="archivos/:id" element={<ArchivoDetailPage />} />
        <Route path="entidades" element={<EntidadesPage />} />
        {canManageUsers && <Route path="users" element={<UsersPage />} />}
        <Route index element={<HomePage />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <CatalogRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
