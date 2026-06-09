import { Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuthContext } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import LoginPage from '@/features/login/pages/LoginPage'
import RegisterPage from '@/features/register/pages/RegisterPage'
import ProyectosPage from '@/features/proyectos/pages/ProyectosPage'
import ProyectoDetailPage from '@/features/proyectos/pages/ProyectoDetailPage'
import ProductosPage from '@/features/productos/pages/ProductosPage'
import ProductoDetailPage from '@/features/productos/pages/ProductoDetailPage'
import FuentesPage from '@/features/fuentes/pages/FuentesPage'
import FuenteDetailPage from '@/features/fuentes/pages/FuenteDetailPage'
import DatasetsPage from '@/features/datasets/pages/DatasetsPage'
import DatasetDetailPage from '@/features/datasets/pages/DatasetDetailPage'
import EdicionesDatasetPage from '@/features/ediciones_dataset/pages/EdicionesDatasetPage'
import EdicionDatasetDetailPage from '@/features/ediciones_dataset/pages/EdicionDatasetDetailPage'
import DistribucionesPage from '@/features/distribuciones/pages/DistribucionesPage'
import DistribucionDetailPage from '@/features/distribuciones/pages/DistribucionDetailPage'
import BasesDeDatosPage from '@/features/bases_de_datos/pages/BasesDeDatosPage'
import BaseDeDatosDetailPage from '@/features/bases_de_datos/pages/BaseDeDatosDetailPage'
import InformacionTablasPage from '@/features/informacion_tablas/pages/InformacionTablasPage'
import InformacionTablaDetailPage from '@/features/informacion_tablas/pages/InformacionTablaDetailPage'
import ArchivosPage from '@/features/archivos/pages/ArchivosPage'
import ArchivoDetailPage from '@/features/archivos/pages/ArchivoDetailPage'
import ProductoTablasPage from '@/features/producto_tablas/pages/ProductoTablasPage'
import UsuariosPage from '@/features/usuarios/pages/UsuariosPage'
import EntidadesPage from '@/features/entidades/pages/EntidadesPage'
import HomePage from '@/features/home/pages/HomePage'
import ProfilePage from '@/features/profile/pages/ProfilePage'

function CatalogRoutes() {
  const { user, canManageUsers, logout } = useAuthContext()

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="proyectos" element={<ProyectosPage />} />
        <Route path="proyectos/:id" element={<ProyectoDetailPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="productos/:id" element={<ProductoDetailPage />} />
        <Route path="fuentes" element={<FuentesPage />} />
        <Route path="fuentes/:id" element={<FuenteDetailPage />} />
        <Route path="datasets" element={<DatasetsPage />} />
        <Route path="datasets/:id" element={<DatasetDetailPage />} />
        <Route path="ediciones-dataset" element={<EdicionesDatasetPage />} />
        <Route path="ediciones-dataset/:id" element={<EdicionDatasetDetailPage />} />
        <Route path="distribuciones" element={<DistribucionesPage />} />
        <Route path="distribuciones/:id" element={<DistribucionDetailPage />} />
        <Route path="bases-de-datos" element={<BasesDeDatosPage />} />
        <Route path="bases-de-datos/:id" element={<BaseDeDatosDetailPage />} />
        <Route path="informacion-tablas" element={<InformacionTablasPage />} />
        <Route path="informacion-tablas/:id" element={<InformacionTablaDetailPage />} />
        <Route path="archivos" element={<ArchivosPage />} />
        <Route path="archivos/:id" element={<ArchivoDetailPage />} />
        <Route path="producto-tablas" element={<ProductoTablasPage />} />
        <Route path="entidades" element={<EntidadesPage />} />
        {canManageUsers && <Route path="usuarios" element={<UsuariosPage />} />}
        <Route path="perfil" element={<ProfilePage />} />
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
