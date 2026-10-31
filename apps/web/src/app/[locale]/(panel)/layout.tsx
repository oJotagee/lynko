import { redirect } from '@/i18n/navigation'
import { auth } from '@/lib/auth'

export default async function PanelLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) redirect({ href: '/login', locale })

  return children
}
