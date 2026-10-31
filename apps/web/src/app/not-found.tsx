import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { NotFoundAnimation } from './_components/not-found-animation'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md aspect-square">
        <NotFoundAnimation />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mt-4 mb-2">Página não encontrada</h1>
      <p className="text-muted-foreground text-center mb-8">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link href="/" className={buttonVariants({ size: 'lg' })}>
        Voltar para a Home
      </Link>
    </div>
  )
}
