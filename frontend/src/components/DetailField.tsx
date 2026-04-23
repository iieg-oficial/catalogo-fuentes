interface Props {
  label: string
  value: string | null | undefined
}

export default function DetailField({ label, value }: Props) {
  if (!value) return null
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5 break-words">{value}</p>
    </div>
  )
}
