'use client'

import { useQuery } from '@tanstack/react-query'
import { Copy, Download, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { getPublicPageUrl, getQrCodeUrl } from '@/lib/site'
import { portalTheme } from '../portal-theme'

const QR_OPTIONS = { margin: 2, errorCorrectionLevel: 'M' } as const

async function createQrCode(url: string) {
  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' }),
    QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1024 }),
  ])

  return { svg, png }
}

function download(href: string, fileName: string) {
  const link = document.createElement('a')

  link.href = href

  link.download = fileName

  link.click()
}

interface QrCodeDialogProps {
  username: string
  customDomain: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QrCodeDialog({ username, customDomain, open, onOpenChange }: QrCodeDialogProps) {
  const pageUrl = getPublicPageUrl(username, customDomain)

  const { data, isPending, isError } = useQuery({
    queryKey: ['qr-code', username, customDomain],
    queryFn: () => createQrCode(getQrCodeUrl(username, customDomain)),
    enabled: open,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const fileName = `lynko-${username}-qr`

  function downloadSvg() {
    if (!data) return

    const url = URL.createObjectURL(new Blob([data.svg], { type: 'image/svg+xml' }))

    download(url, `${fileName}.svg`)

    URL.revokeObjectURL(url)
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(pageUrl)

      toast.success('URL copiada')
    } catch {
      toast.error('Não foi possível copiar. Tente novamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={portalTheme}>
        <DialogTitle>QR code da sua página</DialogTitle>
        <DialogDescription>
          Use em cartões, cardápios e cartazes. As visitas pelo QR aparecem no Analytics.
        </DialogDescription>
        <div className="flex aspect-square w-full max-w-64 items-center justify-center justify-self-center rounded-xl bg-white p-3">
          {isPending && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
          {isError && (
            <p role="alert" className="text-center text-sm text-destructive">
              Não foi possível gerar o QR code. Feche e abra de novo.
            </p>
          )}
          {data && <img src={data.png} alt={`QR code para ${pageUrl}`} className="size-full" />}
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
          <span className="min-w-0 truncate text-sm">{pageUrl.replace(/^https?:\/\//, '')}</span>
          <Button variant="ghost" size="icon" aria-label="Copiar endereço" onClick={copyUrl}>
            <Copy className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="min-h-11"
            disabled={!data}
            onClick={() => data && download(data.png, `${fileName}.png`)}
          >
            <Download className="size-4" />
            Baixar PNG
          </Button>
          <Button variant="outline" className="min-h-11" disabled={!data} onClick={downloadSvg}>
            <Download className="size-4" />
            Baixar SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
