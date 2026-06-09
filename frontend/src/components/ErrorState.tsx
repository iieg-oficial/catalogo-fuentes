import Button from './Button'

interface Props {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Ocurrió un error al cargar los datos.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-red-400">
      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="text-sm text-gray-600">{message}</p>
      {onRetry && (
        <Button variant="link" onClick={onRetry} className="mt-3 text-sm">
          Reintentar
        </Button>
      )}
    </div>
  )
}
