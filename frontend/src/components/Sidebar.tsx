import { NavLink, useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import {
  proyectosIcon, productosIcon, fuentesIcon, datasetsIcon,
  edicionesIcon, distribucionesIcon, basesDeDatosIcon,
  informacionTablasIcon, archivosIcon,
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
}

function userInitials(correo: string): string {
  const [local] = correo.split('@')
  const parts = local.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

const navItemClass = (isActive: boolean, collapsed: boolean) =>
  `relative flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-md text-[13px] transition-colors duration-150
   ${collapsed ? 'md:mx-auto md:my-1 md:w-10 md:h-10 md:px-0 md:py-0 md:justify-center md:rounded-lg' : ''}
   focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
    isActive
      ? 'bg-brand-400 text-white font-semibold'
      : 'text-white/[78%] hover:bg-brand-700 hover:text-white font-normal'
  }`

export default function Sidebar({ user, onLogout }: Props) {
  const navigate = useNavigate()
  const { open, closeSidebar, collapsed, toggleCollapsed } = useSidebar()

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-40 md:z-auto
        ${collapsed ? 'md:w-16' : 'w-60'} min-h-screen bg-brand-600 text-white flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.1)]
        transition-[transform,width] duration-300 ease-in-out cursor-default
        ${open ? 'translate-x-0 w-60' : '-translate-x-full'} md:translate-x-0
      `}
    >
      <div className={`px-5 py-6 flex items-center ${collapsed ? 'md:px-0 md:justify-center' : 'justify-between'}`}>
        <button
          onClick={() => { navigate('/'); closeSidebar() }}
          aria-label="Ir al inicio"
          className={`text-left transition-opacity duration-150 hover:opacity-80
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded
                     ${collapsed ? 'md:hidden' : ''}`}
        >
          <img src="/logo_blanco_iieg.png" alt="IIEG Jalisco" className="h-7" />
        </button>
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex p-1 rounded text-white/50 hover:text-white
                     transition-colors duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
            <path d="M6 2.5v11" />
            {collapsed
              ? <path d="M9.5 6.5L11.5 8l-2 1.5" />
              : <path d="M11.5 6.5L9.5 8l2 1.5" />}
          </svg>
        </button>
        {/* Mobile close */}
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

      <nav className={`flex-1 pb-4 overflow-y-auto ${collapsed ? 'md:pt-2' : ''}`} aria-label="Navegacion principal">
        <p className={`px-4 pt-1 pb-2 text-[10px] font-bold tracking-[0.18em] text-white/60 uppercase select-none ${collapsed ? 'md:hidden' : ''}`}>
          Catalogo
        </p>

        {CATALOG_LEVELS.map((level) => (
          <NavLink
            key={level.key}
            to={level.path}
            onClick={closeSidebar}
            title={collapsed ? level.label : undefined}
            className={({ isActive }) => navItemClass(isActive, collapsed)}
          >
            {() => (
              <>
                <span className="shrink-0 opacity-70">
                  {CATALOG_ICONS[level.key]?.()}
                </span>
                <span className={`flex-1 truncate ${collapsed ? 'md:hidden' : ''}`}>{level.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {collapsed && <div className="hidden md:block mx-3 my-3 border-t border-white/10" aria-hidden="true" />}

        <p className={`px-4 pt-5 pb-2 text-[10px] font-bold tracking-[0.18em] text-white/60 uppercase select-none ${collapsed ? 'md:hidden' : ''}`}>
          Administracion
        </p>

        <NavLink
          to="/perfil"
          onClick={closeSidebar}
          title={collapsed ? 'Perfil' : undefined}
          className={({ isActive }) => navItemClass(isActive, collapsed)}
        >
          <span className="shrink-0 opacity-70">{usuariosIcon({ size: 14 })}</span>
          <span className={`flex-1 truncate ${collapsed ? 'md:hidden' : ''}`}>Perfil</span>
        </NavLink>

        {user?.permisos?.includes('users:manage') && (
          <>
            <NavLink
              to="/entidades"
              onClick={closeSidebar}
              title={collapsed ? 'Entidades' : undefined}
              className={({ isActive }) => navItemClass(isActive, collapsed)}
            >
              <span className="shrink-0 opacity-70">{entidadesIcon({ size: 14 })}</span>
              <span className={`flex-1 truncate ${collapsed ? 'md:hidden' : ''}`}>Entidades</span>
            </NavLink>

            <NavLink
              to="/usuarios"
              onClick={closeSidebar}
              title={collapsed ? 'Usuarios' : undefined}
              className={({ isActive }) => navItemClass(isActive, collapsed)}
            >
              <span className="shrink-0 opacity-70">{usuariosIcon({ size: 14 })}</span>
              <span className={`flex-1 truncate ${collapsed ? 'md:hidden' : ''}`}>Usuarios</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className={`px-4 py-3.5 border-t border-white/10 flex items-center gap-2.5 ${collapsed ? 'md:px-0 md:flex-col md:gap-2' : ''}`}>
        <button
          onClick={() => { navigate('/perfil'); closeSidebar() }}
          className="w-7 h-7 rounded-full bg-brand-400 flex items-center justify-center shrink-0
                     text-[11px] font-bold text-white ring-1 ring-white/20
                     hover:ring-white/40 transition-all duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          title="Mi perfil"
          aria-label="Ir a mi perfil"
        >
          {user?.correo ? userInitials(user.correo) : '?'}
        </button>
        <button
          onClick={() => { navigate('/perfil'); closeSidebar() }}
          className={`flex-1 min-w-0 text-left hover:opacity-80 transition-opacity duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded
                     ${collapsed ? 'md:hidden' : ''}`}
        >
          <p className="text-[12px] text-white/[85%] truncate leading-tight">{user?.nombre ?? user?.correo}</p>
          <p className="text-[10px] text-white/55 capitalize leading-tight mt-0.5">{user?.rol?.nombre}</p>
        </button>
        <button
          onClick={() => { onLogout(); navigate('/login') }}
          title="Cerrar sesion"
          aria-label="Cerrar sesión"
          className="w-8 h-8 rounded flex items-center justify-center shrink-0
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
