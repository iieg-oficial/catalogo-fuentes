import { Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuthContext } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import LoginPage from '@/features/login/LoginPage'
import RegisterPage from '@/features/register/RegisterPage'
import ProyectosPage from '@/features/proyectos/ProyectosPage'
import ProductosPage from '@/features/productos/ProductosPage'
import FuentesPage from '@/features/fuentes/pages/FuentesPage'
import DatasetsPage from '@/features/datasets/pages/DatasetsPage'
import EdicionesDatasetPage from '@/features/ediciones_dataset/pages/EdicionesDatasetPage'
import DistribucionesPage from '@/features/distribuciones/pages/DistribucionesPage'
import BasesDeDatosPage from '@/features/bases_de_datos/BasesDeDatosPage'
import InformacionTablasPage from '@/features/informacion_tablas/pages/InformacionTablasPage'
import ArchivosPage from '@/features/archivos/ArchivosPage'
import ProductoTablasPage from '@/features/producto_tablas/pages/ProductoTablasPage'
import UsuariosPage from '@/features/usuarios/pages/UsuariosPage'
import EntidadesPage from '@/features/entidades/EntidadesPage'
import HomePage from '@/features/home/HomePage'

function CatalogRoutes() {
  const { user, canManageUsers, logout } = useAuthContext()

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="proyectos" element={<ProyectosPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="fuentes" element={<FuentesPage />} />
        <Route path="datasets" element={<DatasetsPage />} />
        <Route path="ediciones-dataset" element={<EdicionesDatasetPage />} />
        <Route path="distribuciones" element={<DistribucionesPage />} />
        <Route path="bases-de-datos" element={<BasesDeDatosPage />} />
        <Route path="informacion-tablas" element={<InformacionTablasPage />} />
        <Route path="archivos" element={<ArchivosPage />} />
        <Route path="producto-tablas" element={<ProductoTablasPage />} />
        <Route path="entidades" element={<EntidadesPage />} />
        {canManageUsers && <Route path="usuarios" element={<UsuariosPage />} />}
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
