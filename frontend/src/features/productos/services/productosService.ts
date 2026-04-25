import apiClient from '@/services/apiClient'
import type { Producto, ProductoDetail } from '@/types'

export async function getProductos(proyectoId?: string | null): Promise<Producto[]> {
  const params = proyectoId ? { proyecto_id: proyectoId } : {}
  const { data } = await apiClient.get<Producto[]>('/productos/', { params })
  return data
}

export async function getProducto(id: string): Promise<ProductoDetail> {
  const { data } = await apiClient.get<ProductoDetail>(`/productos/${id}`)
  return data
}

export async function createProducto(payload: {
  nombre: string
  proyecto_id: string
  descripcion?: string
}): Promise<Producto> {
  const { data } = await apiClient.post<Producto>('/productos/', payload)
  return data
}

export async function updateProducto(id: string, payload: { nombre?: string; descripcion?: string; proyecto_id?: string; meta?: Record<string, unknown> }): Promise<Producto> {
  const { data } = await apiClient.put<Producto>(`/productos/${id}`, payload)
  return data
}

export async function deleteProducto(id: string): Promise<void> {
  await apiClient.delete(`/productos/${id}`)
}
