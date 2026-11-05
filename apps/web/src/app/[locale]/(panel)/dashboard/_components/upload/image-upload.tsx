'use client'

import { Camera, ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ApiMedia } from '../../_actions/confirm-media'
import {
  IMAGE_MIME_TYPES,
  imageFileSchema,
  imageMaxMegabytes,
  type MediaType,
} from './image-upload-schema'
import { useImageUpload } from './use-image-upload'

interface ImageUploadProps {
  id: string
  type: MediaType
  alt: string
  imageUrl: string | null
  disabled?: boolean
  invalid?: boolean
  onUploaded: (media: ApiMedia) => void
  onRemove: () => void
}

export function ImageUpload({
  id,
  type,
  alt,
  imageUrl,
  disabled = false,
  invalid = false,
  onUploaded,
  onRemove,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)

  const [preview, setPreview] = useState<string | null>(null)

  const [message, setMessage] = useState<string | null>(null)

  const [broken, setBroken] = useState(false)

  const { mutateAsync, isPending } = useImageUpload(type)

  useEffect(() => {
    if (!preview) return

    return () => URL.revokeObjectURL(preview)
  }, [preview])

  const shown = preview ?? imageUrl

  async function upload(next: File) {
    const result = imageFileSchema(type).safeParse(next)

    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? 'Arquivo inválido')

      return
    }

    setMessage(null)

    setBroken(false)

    setFile(next)

    setPreview(URL.createObjectURL(next))

    try {
      onUploaded(await mutateAsync(next))

      setFile(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.')
    } finally {
      setPreview(null)
    }
  }

  function remove() {
    setFile(null)

    setPreview(null)

    setMessage(null)

    onRemove()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button
          id={id}
          type="button"
          variant="ghost"
          className={cn(
            'group/upload relative size-20 shrink-0 overflow-hidden p-0 hover:bg-transparent',
            type === 'avatar' ? 'rounded-full! border-0' : 'rounded-lg! border border-border',
            invalid && 'ring-2 ring-destructive',
          )}
          disabled={disabled || isPending}
          aria-invalid={invalid}
          aria-label={isPending ? 'Enviando imagem' : shown ? 'Trocar imagem' : 'Enviar imagem'}
          onClick={() => inputRef.current?.click()}
        >
          {type === 'avatar' ? (
            <Avatar className="size-full">
              {shown && <AvatarImage src={shown} alt={alt} />}
              <AvatarFallback>
                <ImageIcon className="size-6" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          ) : shown && !broken ? (
            <img
              src={shown}
              alt={alt}
              loading="lazy"
              className="size-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden="true" />
            </span>
          )}
          <span
            data-pending={isPending}
            className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-background opacity-0 motion-safe:transition-opacity group-hover/upload:opacity-100 group-focus-visible/upload:opacity-100 data-[pending=true]:opacity-100"
          >
            {isPending ? (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="size-6" aria-hidden="true" />
            )}
          </span>
        </Button>
        <div className="min-w-0 space-y-1">
          <p className="text-sm">
            {isPending
              ? 'Enviando...'
              : shown
                ? 'Clique na imagem para trocar'
                : 'Clique para enviar uma imagem'}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WebP, até {imageMaxMegabytes[type]} MB.
          </p>
          {shown && !isPending && (
            <Button
              type="button"
              variant="link"
              className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              disabled={disabled}
              onClick={remove}
            >
              <Trash2 className="size-3" />
              Remover
            </Button>
          )}
        </div>
        <Input
          ref={inputRef}
          type="file"
          accept={IMAGE_MIME_TYPES.join(',')}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const next = event.target.files?.[0]

            event.target.value = ''

            if (next) upload(next)
          }}
        />
      </div>
      {message && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-destructive">
          <span>{message}</span>
          {file && !isPending && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => upload(file)}
            >
              Tentar novamente
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
