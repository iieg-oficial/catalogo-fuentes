import { API_URL, TOKEN_KEY } from '@/consts'
import type { ProductoTabla } from '@/types'

function headers() {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function getProductoTablas(
  productoId?: string,
  informacionTablasId?: string,
): Promise<ProductoTabla[]> {
  const params = new URLSearchParams()
  if (productoId) params.set('producto_id', productoId)
  if (informacionTablasId) params.set('informacion_tablas_id', informacionTablasId)
  const qs = params.toString()
  const res = await fetch(`${API_URL}/producto-tablas/${qs ? `?${qs}` : ''}`, { headers: headers() })
  if (!res.ok) throw new Error('Failed to fetch producto-tablas')
  return res.json()
}

export async function createProductoTabla(
  data: { producto_id: string; informacion_tablas_id: string; fecha_vinculacion?: string; observaciones?: string },
): Promise<ProductoTabla> {
  const res = await fetch(`${API_URL}/producto-tablas/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create producto-tabla')
  return res.json()
}

export async function deleteProductoTabla(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/producto-tablas/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error('Failed to delete producto-tabla')
}
