import Sidebar from './Sidebar'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'
import type { User } from '@/types'

interface Props {
  user: User | null
  onLogout: () => void
  children: React.ReactNode
}

function LayoutInner({ user, onLogout, children }: Props) {
  const { open, closeSidebar } = useSidebar()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  )
}

export default function Layout({ user, onLogout, children }: Props) {
  return (
    <SidebarProvider>
      <LayoutInner user={user} onLogout={onLogout}>
        {children}
      </LayoutInner>
    </SidebarProvider>
  )
}
