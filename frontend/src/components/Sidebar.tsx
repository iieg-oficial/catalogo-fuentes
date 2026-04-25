import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
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

const CATALOG_ICONS: Record<string, ReactNode> = {
  proyectos: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5.5a1 1 0 011-1h2.8l1.2-1.5H13a1 1 0 011 1v7.5a1 1 0 01-1 1H3a1 1 0 01-1-1V5.5z"/>
    </svg>
  ),
  productos: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="12" height="7" rx="1"/>
      <rect x="4" y="4" width="8" height="5" rx="1"/>
      <rect x="6" y="1.5" width="4" height="4" rx="1"/>
    </svg>
  ),
  tablas: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/>
      <path d="M1.5 5.5h13M6 5.5V14.5"/>
    </svg>
  ),
  'bases-de-datos': (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="4" rx="5.5" ry="2"/>
      <path d="M2.5 4v8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V4"/>
      <path d="M2.5 8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2"/>
    </svg>
  ),
  instrumentos: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1" width="8" height="14" rx="1"/>
      <path d="M6.5 1v2h3V1M6 7h4M6 10h4M6 12.5h2"/>
    </svg>
  ),
  urls: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5"/>
      <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1"/>
    </svg>
  ),
  archivos: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 1.5H4a1 1 0 00-1 1v11a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1.5z"/>
      <path d="M9.5 1.5V5.5H13.5M5.5 8.5h5M5.5 11h3.5"/>
    </svg>
  ),
}

const ADMIN_ICONS: Record<string, ReactNode> = {
  entidades: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="9" width="4" height="5.5"/>
      <rect x="10.5" y="9" width="4" height="5.5"/>
      <rect x="5" y="3" width="6" height="5"/>
      <path d="M8 3V2M3.5 9L8 7.5M12.5 9L8 7.5"/>
    </svg>
  ),
  users: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5"/>
      <path d="M2.5 14c0-3 2.46-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/>
    </svg>
  ),
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
                <span className={`flex-shrink-0 transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                  {CATALOG_ICONS[level.key]}
                </span>
                <span className="flex-1 truncate">{level.label}</span>
                <span className={`text-[10px] font-mono tabular-nums flex-shrink-0 transition-opacity duration-150 ${isActive ? 'opacity-35' : 'opacity-0 group-hover:opacity-20'}`}>
                  {i + 1}
                </span>
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
              <span className={`flex-shrink-0 transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                {ADMIN_ICONS.entidades}
              </span>
              <span className="flex-1 truncate">Entidades</span>
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
                <span className={`flex-shrink-0 transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                  {ADMIN_ICONS.users}
                </span>
                <span className="flex-1 truncate">Usuarios</span>
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
