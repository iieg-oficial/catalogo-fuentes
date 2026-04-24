import { NavLink, useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import { useSidebar } from '@/context/SidebarContext'
import type { User } from '@/types'

interface Props {
  user: User | null
  onLogout: () => void
}

function userInitials(email: string): string {
  const [local] = email.split('@')
  const parts = local.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

const navItemClass = (isActive: boolean) =>
  `nav-item-enter group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150
   focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 hover:translate-x-1 ${
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
          className="text-left transition-all duration-200 hover:scale-[1.03] hover:opacity-90
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
        <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-brand-100/35 uppercase select-none">
          Catálogo
        </p>

        {CATALOG_LEVELS.map((level, i) => (
          <NavLink
            key={level.key}
            to={level.path}
            onClick={closeSidebar}
            className={({ isActive }) => navItemClass(isActive)}
            style={{ animationDelay: `${i * 35}ms` }}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'bg-accent opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}
                />
                {level.label}
              </>
            )}
          </NavLink>
        ))}

        <div className="mx-1 mt-3 mb-2 border-t border-brand-700/60" />

        <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-brand-100/35 uppercase select-none">
          Administración
        </p>

        <NavLink
          to="/entidades"
          onClick={closeSidebar}
          className={({ isActive }) => navItemClass(isActive)}
          style={{ animationDelay: `${CATALOG_LEVELS.length * 35}ms` }}
        >
          {({ isActive }) => (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${
                  isActive ? 'bg-accent opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
              />
              Entidades
            </>
          )}
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink
            to="/users"
            onClick={closeSidebar}
            className={({ isActive }) => navItemClass(isActive)}
            style={{ animationDelay: `${(CATALOG_LEVELS.length + 1) * 35}ms` }}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'bg-accent opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}
                />
                Usuarios
              </>
            )}
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-brand-700">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0
                       text-[11px] font-semibold text-white/90 ring-1 ring-white/10"
          >
            {user?.email ? userInitials(user.email) : '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-brand-100/80 truncate leading-tight">{user?.email}</p>
            <p className="text-[10px] text-brand-100/45 capitalize leading-tight mt-0.5">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { onLogout(); navigate('/login') }}
          className="group flex items-center gap-1.5 text-xs text-brand-100/50 hover:text-white
                     transition-colors duration-150
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
        >
          <svg
            width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11L14 8l-3.5-3M14 8H6" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
