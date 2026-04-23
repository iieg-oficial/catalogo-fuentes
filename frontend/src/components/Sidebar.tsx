import { NavLink, useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import { useSidebar } from '@/context/SidebarContext'
import type { User } from '@/types'

interface Props {
  user: User | null
  onLogout: () => void
}

const navItemClass = (isActive: boolean) =>
  `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-150
   focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
    isActive
      ? 'bg-brand-600 text-white font-medium'
      : 'text-brand-100/80 hover:bg-brand-700 hover:text-white'
  }`

export default function Sidebar({ user, onLogout }: Props) {
  const navigate = useNavigate()
  const { open, closeSidebar } = useSidebar()

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-40 md:z-auto
        w-56 min-h-screen bg-brand-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}
    >
      <div className="px-4 py-5 border-b border-brand-700 flex items-center justify-between">
        <button
          onClick={() => { navigate('/'); closeSidebar() }}
          aria-label="Ir al inicio"
          className="text-left hover:opacity-80 transition-opacity duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
        >
          <img src="/logo_blanco_iieg.png" alt="IIEG Jalisco" className="h-7" />
        </button>
        <button
          onClick={closeSidebar}
          className="md:hidden p-1 rounded text-brand-100/70 hover:text-white
                     transition-colors duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          aria-label="Cerrar menú"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto" aria-label="Navegación principal">
        {CATALOG_LEVELS.map((level) => (
          <NavLink
            key={level.key}
            to={level.path}
            onClick={closeSidebar}
            className={({ isActive }) => navItemClass(isActive)}
          >
            {level.label}
          </NavLink>
        ))}

        <div className="mx-1 mt-3 mb-0.5 border-t border-brand-700/60" />

        <NavLink
          to="/entidades"
          onClick={closeSidebar}
          className={({ isActive }) => navItemClass(isActive)}
        >
          Entidades
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink
            to="/users"
            onClick={closeSidebar}
            className={({ isActive }) => navItemClass(isActive)}
          >
            Usuarios
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-brand-700">
        <p className="text-xs text-brand-100/75 truncate">{user?.email}</p>
        <p className="text-xs text-brand-100/50 capitalize mt-0.5">{user?.role}</p>
        <button
          onClick={() => { onLogout(); navigate('/login') }}
          className="mt-3 flex items-center gap-1.5 text-xs text-brand-100/60 hover:text-white
                     transition-colors duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11L14 8l-3.5-3M14 8H6" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
