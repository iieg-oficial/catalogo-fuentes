import { useState } from 'react'
import Modal from './Modal'

interface MetaSectionProps {
  meta: Record<string, unknown>
  onSave: (newMeta: Record<string, unknown>) => Promise<void>
  canWrite: boolean
}

export default function MetaSection({ meta, onSave, canWrite }: MetaSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const entries = Object.entries(meta)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ ...meta, [key]: value })
      setKey('')
      setValue('')
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (k: string) => {
    setSaving(true)
    try {
      const updated = { ...meta }
      delete updated[k]
      await onSave(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-100 text-left text-xs uppercase tracking-wider">
              <th className="px-3 py-2 font-semibold w-48">Clave</th>
              <th className="px-3 py-2 font-semibold">Valor</th>
              {canWrite && <th className="px-3 py-2 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 && !canWrite && (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-sm text-gray-400 text-center">
                  Sin metadatos.
                </td>
              </tr>
            )}
            {entries.map(([k, v], i) => (
              <tr key={k} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 font-mono text-xs text-gray-900">{k}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{String(v ?? '')}</td>
                {canWrite && (
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDelete(k)}
                      disabled={saving}
                      aria-label={`Eliminar ${k}`}
                      className="text-gray-300 hover:text-red-500 text-base leading-none disabled:opacity-30"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {canWrite && (
              <tr className="bg-white border-t border-gray-200 hover:bg-gray-50">
                <td colSpan={3} className="px-3 py-2">
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    + Agregar campo
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} title="Agregar metadato" onClose={() => setShowForm(false)}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clave *</label>
            <input
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. fuente"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
            <input
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. INEGI 2023"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50">
              {saving ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
