'use client'

import { memo, useDeferredValue, useMemo } from 'react'
import { type Control, useWatch } from 'react-hook-form'

import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import type { DashboardData } from '../../_components/dashboard-data'
import { PreviewFrame } from './preview-frame'

const MemoPreviewFrame = memo(PreviewFrame)

interface LivePreviewProps {
  control: Control<PageAppearance>
  data: DashboardData
  backgroundImageUrl: string | null
}

export function LivePreview({ control, data, backgroundImageUrl }: LivePreviewProps) {
  const appearance = useDeferredValue(useWatch({ control }) as PageAppearance)

  const previewData = useMemo(
    () => ({ ...data, appearance, backgroundImageUrl }),
    [data, appearance, backgroundImageUrl],
  )

  return <MemoPreviewFrame data={previewData} />
}
