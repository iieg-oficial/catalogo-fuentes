import TagPills from './TagPills'

interface Props {
  title: string
  subtitle?: string | null
  badges?: string[]
  onClick: () => void
}

export default function CatalogCard({ title, subtitle, badges, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-brand-300 hover:shadow-sm transition-all group"
    >
      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700 truncate">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{subtitle}</p>}
      {badges && badges.length > 0 && (
        <div className="mt-2">
          <TagPills items={badges} label="CATEGORÍAS" />
        </div>
      )}
    </button>
  )
}
