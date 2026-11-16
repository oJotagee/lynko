'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DomainRecord } from '../../_data-access/get-domain'

const PURPOSES: Record<DomainRecord['purpose'], string> = {
  ownership: 'Prova que o domínio é seu',
  routing: 'Aponta o domínio para o Lynko',
  verification: 'Pedido pelo provedor de hospedagem',
}

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)

    toast.success('Valor copiado')
  } catch {
    toast.error('Não foi possível copiar. Tente novamente.')
  }
}

export function DomainRecords({ records }: { records: DomainRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={`${record.type}-${record.name}-${record.value}`}>
            <TableCell className="align-top font-semibold">{record.type}</TableCell>
            <TableCell className="align-top">
              <div className="flex items-center gap-1">
                <code className="font-mono text-xs">{record.name}</code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Copiar nome ${record.name}`}
                  onClick={() => copy(record.name)}
                >
                  <Copy />
                </Button>
              </div>
            </TableCell>
            <TableCell className="align-top whitespace-normal">
              <div className="flex items-start gap-1">
                <code className="min-w-0 font-mono text-xs break-all">{record.value}</code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label={`Copiar valor do registro ${record.type}`}
                  onClick={() => copy(record.value)}
                >
                  <Copy />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{PURPOSES[record.purpose]}</p>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
