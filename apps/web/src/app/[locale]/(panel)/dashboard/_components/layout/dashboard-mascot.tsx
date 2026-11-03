import { LynkoMascot } from '../../../../(public)/_components/lynko-mascot'

export function DashboardMascot({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`lynko-login-brand shrink-0 [&_.lynko-mascot]:w-full! ${className}`}
    >
      <LynkoMascot animated={false} />
    </div>
  )
}
