import { NavLink, useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import {
  proyectosIcon, productosIcon, fuentesIcon, datasetsIcon,
  edicionesIcon, distribucionesIcon, basesDeDatosIcon,
  informacionTablasIcon, archivosIcon, productoTablasIcon,
  entidadesIcon, usuariosIcon,
} from '@/consts/sectionIcons'
import { useSidebar } from '@/context/SidebarContext'
import type { Usuario } from '@/types'

interface Props {
  user: Usuario | null
  onLogout: () => void
}

const CATALOG_ICONS: Record<string, () => React.ReactNode> = {
  proyectos:            () => proyectosIcon({ size: 14 }),
  productos:            () => productosIcon({ size: 14 }),
  fuentes:              () => fuentesIcon({ size: 14 }),
  datasets:             () => datasetsIcon({ size: 14 }),
  'ediciones-dataset':  () => edicionesIcon({ size: 14 }),
  distribuciones:       () => distribucionesIcon({ size: 14 }),
  'bases-de-datos':     () => basesDeDatosIcon({ size: 14 }),
  'informacion-tablas': () => informacionTablasIcon({ size: 14 }),
  archivos:             () => archivosIcon({ size: 14 }),
  'producto-tablas':    () => productoTablasIcon({ size: 14 }),
}

function userInitials(correo: string): string {
  const [local] = correo.split('@')
  const parts = local.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

const navItemClass = (isActive: boolean) =>
  `relative flex items-center gap-2.5 px-4 py-2 mx-2 rounded-md text-[13px] transition-colors duration-150
   focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
    isActive
      ? 'bg-white/10 text-white font-semibold'
      : 'text-white/[78%] hover:bg-white/[5%] hover:text-white font-normal'
  }`

export default function Sidebar({ user, onLogout }: Props) {
  const navigate = useNavigate()
  const { open, closeSidebar } = useSidebar()

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-40 md:z-auto
        w-60 min-h-screen bg-brand-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}
    >
      <div className="px-5 py-6 flex items-center justify-between">
        <button
          onClick={() => { navigate('/'); closeSidebar() }}
          aria-label="Ir al inicio"
          className="text-left transition-opacity duration-150 hover:opacity-80
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
        >
          <img src="/logo_blanco_iieg.png" alt="IIEG Jalisco" className="h-7" />
        </button>
        <button
          onClick={closeSidebar}
          className="md:hidden p-1 rounded text-white/50 hover:text-white
                     transition-colors duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          aria-label="Cerrar menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 pb-4 overflow-y-auto" aria-label="Navegacion principal">
        <p className="px-4 pt-1 pb-2 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase select-none">
          Catalogo
        </p>

        {CATALOG_LEVELS.map((level) => (
          <NavLink
            key={level.key}
            to={level.path}
            onClick={closeSidebar}
            className={({ isActive }) => navItemClass(isActive)}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -left-2 top-2 bottom-2 w-0.5 bg-white rounded-r" />
                )}
                <span className="shrink-0 opacity-70">
                  {CATALOG_ICONS[level.key]?.()}
                </span>
                <span className="flex-1 truncate">{level.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {user?.permisos?.includes('users:manage') && (
          <>
            <p className="px-4 pt-5 pb-2 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase select-none">
              Administracion
            </p>

            <NavLink
              to="/entidades"
              onClick={closeSidebar}
              className={({ isActive }) => navItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -left-2 top-2 bottom-2 w-0.5 bg-white rounded-r" />
                  )}
                  <span className="shrink-0 opacity-70">{entidadesIcon({ size: 14 })}</span>
                  <span className="flex-1 truncate">Entidades</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/usuarios"
              onClick={closeSidebar}
              className={({ isActive }) => navItemClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -left-2 top-2 bottom-2 w-0.5 bg-white rounded-r" />
                  )}
                  <span className="shrink-0 opacity-70">{usuariosIcon({ size: 14 })}</span>
                  <span className="flex-1 truncate">Usuarios</span>
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      <div className="px-4 py-3.5 border-t border-white/[8%] flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0
                     text-[11px] font-bold text-white/90 ring-1 ring-white/10"
        >
          {user?.correo ? userInitials(user.correo) : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-white/[85%] truncate leading-tight">{user?.nombre ?? user?.correo}</p>
          <p className="text-[10px] text-white/45 capitalize leading-tight mt-0.5">{user?.rol?.nombre}</p>
        </div>
        <button
          onClick={() => { onLogout(); navigate('/login') }}
          title="Cerrar sesion"
          className="w-6 h-6 rounded flex items-center justify-center
                     text-white/50 hover:text-white transition-colors duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11L14 8l-3.5-3M14 8H6" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
