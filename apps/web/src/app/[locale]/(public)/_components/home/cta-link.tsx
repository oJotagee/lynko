import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface CtaLinkProps {
  className?: string
  children: React.ReactNode
}

export function CtaLink({ className = '', children }: CtaLinkProps) {
  return (
    <Link
      href="/register"
      className={cn(
        buttonVariants(),
        'inline-flex min-h-11 items-center justify-center gap-[9px] rounded-[10px] border border-[#171716] bg-[#171716] px-5 text-sm font-semibold text-white no-underline transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#171716] hover:text-white hover:shadow-[0_5px_0_#17171620]',
        className,
      )}
    >
      {children}
    </Link>
  )
}
