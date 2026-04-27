import Modal from '@/components/Modal'
import { type ColumnType, type ListOption, LIST_COLOR_PALETTE } from '@/hooks/useMetaColumns'

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

const PRIORITY_PREVIEWS = [
  { label: 'Urgente', color: '#dc2626' },
  { label: 'Alta', color: '#f97316' },
  { label: 'Media', color: '#f59e0b' },
  { label: 'Baja', color: '#22c55e' },
  { label: 'Sin prioridad', color: '#94a3b8' },
]

interface ColFormModalProps {
  open: boolean
  editingKey: string | null
  name: string
  type: ColumnType
  listOptions: ListOption[]
  color: string
  onClose: () => void
  onNameChange: (v: string) => void
  onTypeChange: (v: ColumnType) => void
  onListOptionsChange: (opts: ListOption[]) => void
  onColorChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function ColFormModal({
  open, editingKey, name, type, listOptions, color,
  onClose, onNameChange, onTypeChange, onListOptionsChange, onColorChange, onSubmit,
}: ColFormModalProps) {
  return (
    <Modal open={open} title={editingKey ? 'Editar columna' : 'Nueva columna'} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
            <input required value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="ej. proposito" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
            <select value={type} onChange={(e) => onTypeChange(e.target.value as ColumnType)} className={`${inputCls} bg-white`}>
              <option value="text">Texto</option>
              <option value="number">Número</option>
              <option value="url">URL</option>
              <option value="date">Fecha</option>
              <option value="boolean">Booleano</option>
              <option value="list">Lista</option>
              <option value="priority">Prioridad</option>
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3">
          {type !== 'priority' && (
            <div className={`flex items-center gap-3 ${type === 'list' ? 'opacity-40' : ''}`}>
              <button
                type="button"
                role="switch"
                aria-checked={!!color && type !== 'list'}
                onClick={() => { if (!color) onColorChange(LIST_COLOR_PALETTE[0]); else onColorChange('') }}
                disabled={type === 'list'}
                className={`relative w-8 h-4 rounded-full transition-colors duration-150 shrink-0
                  ${color && type !== 'list' ? 'bg-brand-600' : 'bg-neutral-200'}
                  ${type !== 'list' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-150 ${color && type !== 'list' ? 'translate-x-4' : ''}`} />
              </button>
              <span className="text-sm font-medium text-neutral-700">Color</span>
              {color && type !== 'list' && (
                <div className="flex items-center gap-1.5">
                  {LIST_COLOR_PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => onColorChange(c)} title={c}
                      className={`w-4 h-4 rounded-full transition-all duration-100 ${color === c ? 'ring-2 ring-offset-1 ring-neutral-400 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
              {type === 'list' && <span className="text-xs text-neutral-300">Las listas usan colores por opción</span>}
            </div>
          )}

          {type === 'priority' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Niveles</label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_PREVIEWS.map((lvl) => (
                  <span key={lvl.label}
                    className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-sm text-[12px] font-medium whitespace-nowrap"
                    style={{ backgroundColor: `${lvl.color}1a`, color: lvl.color }}>
                    <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: lvl.color }} />
                    {lvl.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {type === 'list' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Opciones</label>
              <div className="space-y-1.5">
                {listOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <label className="shrink-0 cursor-pointer" title="Cambiar color">
                      <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: opt.color ?? '#94a3b8' }} />
                      <input type="color" value={opt.color ?? '#94a3b8'}
                        onChange={(e) => onListOptionsChange(listOptions.map((o, i) => i === idx ? { ...o, color: e.target.value } : o))}
                        className="sr-only" />
                    </label>
                    <input value={opt.label}
                      onChange={(e) => onListOptionsChange(listOptions.map((o, i) => i === idx ? { ...o, label: e.target.value } : o))}
                      placeholder="Opción…"
                      className="flex-1 px-2.5 py-1 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    <button type="button"
                      onClick={() => onListOptionsChange(listOptions.filter((_, i) => i !== idx))}
                      className="text-neutral-300 hover:text-red-400 transition-colors text-lg leading-none"
                      aria-label="Quitar opción">×</button>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => onListOptionsChange([...listOptions, { label: '', color: LIST_COLOR_PALETTE[listOptions.length % LIST_COLOR_PALETTE.length] }])}
                className="mt-2 flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
                Agregar opción
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">
            {editingKey ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
