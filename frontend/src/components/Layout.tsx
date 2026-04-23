import Sidebar from './Sidebar'
import type { User } from '@/types'

interface Props {
  user: User | null
  onLogout: () => void
  children: React.ReactNode
}

export default function Layout({ user, onLogout, children }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  )
}
