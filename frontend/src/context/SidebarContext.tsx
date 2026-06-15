import { createContext, useContext, useState, type ReactNode } from 'react'

const COLLAPSE_KEY = 'sidebar_collapsed'

interface SidebarContextValue {
  open: boolean
  openSidebar: () => void
  closeSidebar: () => void
  collapsed: boolean
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true')

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, String(next))
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{
      open,
      openSidebar: () => setOpen(true),
      closeSidebar: () => setOpen(false),
      collapsed,
      toggleCollapsed,
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be inside SidebarProvider')
  return ctx
}
