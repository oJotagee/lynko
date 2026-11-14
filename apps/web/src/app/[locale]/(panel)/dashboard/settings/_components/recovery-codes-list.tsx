'use client'

import { Copy, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const FILE_NAME = 'lynko-codigos-recuperacao.txt'

function downloadCodes(codes: string[]) {
  const url = URL.createObjectURL(new Blob([`${codes.join('\n')}\n`], { type: 'text/plain' }))

  const link = document.createElement('a')

  link.href = url

  link.download = FILE_NAME

  link.click()

  URL.revokeObjectURL(url)
}

export function RecoveryCodesList({ codes }: { codes: string[] }) {
  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))

      toast.success('Códigos copiados')
    } catch {
      toast.error('Não foi possível copiar. Use o download.')
    }
  }

  return (
    <div className="grid gap-4">
      <ol
        aria-label="Códigos de recuperação"
        className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm tabular-nums"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ol>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="min-h-11" onClick={copyCodes}>
          <Copy className="size-4" />
          Copiar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => downloadCodes(codes)}
        >
          <Download className="size-4" />
          Baixar .txt
        </Button>
      </div>
    </div>
  )
}
