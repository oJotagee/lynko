interface LynkoMascotProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'happy' | 'sad'
  animated?: boolean
  className?: string
}

export function LynkoMascot({ size = 'md', variant = 'happy', animated = true, className = '' }: LynkoMascotProps) {
  return (
    <svg className={`lynko-mascot lynko-mascot-${size}${animated ? ' lynko-mascot-animated' : ''} ${className}`} viewBox="0 0 190 180" role="img" aria-label={variant === 'happy' ? 'Mascote Lynko feliz' : 'Mascote Lynko triste'}>
      <path className="lynko-mascot-tail" d="M145 125c27 2 35-12 23-25" />
      <path className="lynko-mascot-body lynko-mascot-back" d="M105 25c34-6 59 17 55 50l-7 55c-3 24-23 39-47 35-27-4-42-27-35-53l12-65c2-11 10-20 22-22Z" />
      <path className="lynko-mascot-body lynko-mascot-front" d="M68 35c29-5 52 14 50 43l-5 54c-2 25-22 42-47 39-28-3-45-27-38-54l13-60c2-12 13-20 27-22Z" />
      <path className="lynko-mascot-gap" d="M84 67c8 5 13 14 13 24 0 17-13 31-30 31-9 0-17-4-22-10" />
      <circle className="lynko-mascot-eye" cx="66" cy="73" r="4" />
      <circle className="lynko-mascot-eye" cx="96" cy="67" r="4" />
      <path className="lynko-mascot-face" d={variant === 'happy' ? 'M68 88c7 8 17 8 24 0' : 'M70 94c7-6 15-6 22 0'} />
    </svg>
  )
}
