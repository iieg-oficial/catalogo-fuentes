import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 focus:ring-2 focus:ring-brand-400 shadow-sm',
  secondary: 'text-brand-600 bg-brand-500/[8%] hover:bg-brand-500/[12%]',
  ghost:     'text-ink/70 hover:bg-ink/[5%] hover:text-ink',
  danger:    'text-error-600 bg-error-50 hover:bg-error-200/60',
  link:      'text-brand-600 hover:text-brand-700 hover:underline p-0 h-auto rounded-none',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-1.5',
  lg: 'min-h-[44px] px-5 text-sm gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, loading, fullWidth, className = '', children, disabled, ...rest }, ref) => {
    const isLink = variant === 'link'

    const base = [
      'inline-flex items-center justify-center font-medium transition-colors duration-150',
      'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
      isLink ? '' : 'rounded-md',
      variantStyles[variant],
      isLink ? '' : sizeStyles[size],
      fullWidth ? 'w-full' : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <button ref={ref} className={base} disabled={disabled || loading} {...rest}>
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
