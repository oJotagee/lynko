'use client'

import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { AnalyticsTimeseriesPoint } from '../_data-access/get-analytics-timeseries'

const config = {
  views: { label: 'Visualizações', color: 'var(--chart-1)' },
  clicks: { label: 'Cliques', color: 'var(--chart-2)' },
} satisfies ChartConfig

type ChartVariant = 'area' | 'bar'

function formatDay(date: string) {
  const [, month, day] = date.split('-')

  return `${day}/${month}`
}

function ChartBody({ data, variant }: { data: AnalyticsTimeseriesPoint[]; variant: ChartVariant }) {
  const shared = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
        tickFormatter={formatDay}
      />
      <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
      <ChartTooltip
        content={<ChartTooltipContent labelFormatter={(value) => formatDay(String(value))} />}
      />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  )

  if (variant === 'bar') {
    return (
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        {shared}
        <Bar dataKey="views" fill="var(--color-views)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 0, 0]} />
      </BarChart>
    )
  }

  return (
    <AreaChart data={data} margin={{ left: 0, right: 8 }}>
      {shared}
      <Area
        dataKey="views"
        type="monotone"
        fill="var(--color-views)"
        fillOpacity={0.15}
        stroke="var(--color-views)"
      />
      <Area
        dataKey="clicks"
        type="monotone"
        fill="var(--color-clicks)"
        fillOpacity={0.15}
        stroke="var(--color-clicks)"
      />
    </AreaChart>
  )
}

export function TimeseriesChart({ data }: { data: AnalyticsTimeseriesPoint[] }) {
  const [variant, setVariant] = useState<ChartVariant>('area')

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Desempenho
          </p>
          <CardTitle className="text-lg">Visualizações e cliques</CardTitle>
        </div>
        <ToggleGroup
          aria-label="Tipo de gráfico"
          variant="outline"
          spacing={0}
          value={[variant]}
          onValueChange={(values) => {
            const next = values[0]

            if (next) setVariant(next as ChartVariant)
          }}
        >
          <ToggleGroupItem value="area">Linhas</ToggleGroupItem>
          <ToggleGroupItem value="bar">Barras</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <ChartBody data={data} variant={variant} />
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
