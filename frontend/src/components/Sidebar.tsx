import { NavLink, useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import type { User } from '@/types'

interface Props {
  user: User | null
  onLogout: () => void
}

export default function Sidebar({ user, onLogout }: Props) {
  const navigate = useNavigate()

  return (
    <aside className="w-56 min-h-screen bg-brand-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-brand-700">
        <h1 className="text-sm font-bold uppercase tracking-widest text-brand-100">IIEG</h1>
        <p className="text-xs text-brand-100/60 mt-0.5">Dashboard Tracking</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {CATALOG_LEVELS.map((level) => (
          <NavLink
            key={level.key}
            to={level.path}
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
        <p className="text-xs text-brand-100/60 truncate">{user?.email}</p>
        <p className="text-xs text-brand-100/40 capitalize">{user?.role}</p>
        <button
          onClick={() => {
            onLogout()
            navigate('/login')
          }}
          className="mt-2 text-xs text-brand-100/60 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
