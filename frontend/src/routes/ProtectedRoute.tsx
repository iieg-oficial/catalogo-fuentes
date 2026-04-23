import { Navigate } from 'react-router-dom'
import { TOKEN_KEY } from '@/consts'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
