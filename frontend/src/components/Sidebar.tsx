import { NavLink, useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import { useSidebar } from '@/context/SidebarContext'
import type { User } from '@/types'

interface Props {
  user: User | null
  onLogout: () => void
}

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
          className="text-left hover:opacity-80 transition-opacity"
        >
          <h1 className="text-sm font-bold uppercase tracking-widest text-brand-100">IIEG</h1>
          <p className="text-xs text-brand-100/60 mt-0.5">Dashboard Tracking</p>
        </button>
        <button
          onClick={closeSidebar}
          className="md:hidden p-1 rounded text-brand-100/70 hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5" aria-label="Navegación principal">
        {CATALOG_LEVELS.map((level) => (
          <NavLink
            key={level.key}
            to={level.path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-brand-100/80 hover:bg-brand-700 hover:text-white'
              }`
            }
          >
            {level.label}
          </NavLink>
        ))}

        <NavLink
          to="/entidades"
          onClick={closeSidebar}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mt-4 border-t border-brand-700 pt-4 ${
              isActive
                ? 'bg-brand-600 text-white font-medium'
                : 'text-brand-100/80 hover:bg-brand-700 hover:text-white'
            }`
          }
        >
          Entidades
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink
            to="/users"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mt-4 border-t border-brand-700 pt-4 ${
                isActive
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-brand-100/80 hover:bg-brand-700 hover:text-white'
              }`
            }
          >
            Usuarios
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-brand-700">
        <p className="text-xs text-brand-100/75 truncate">{user?.email}</p>
        <p className="text-xs text-brand-100/70 capitalize">{user?.role}</p>
        <button
          onClick={() => {
            onLogout()
            navigate('/login')
          }}
          className="mt-2 text-xs text-brand-100/75 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
