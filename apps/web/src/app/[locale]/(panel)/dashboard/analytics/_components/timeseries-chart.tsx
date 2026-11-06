'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { AnalyticsTimeseriesPoint } from '../_data-access/get-analytics-timeseries'

const config = {
  views: { label: 'Visualizações', color: 'var(--chart-1)' },
  clicks: { label: 'Cliques', color: 'var(--chart-2)' },
} satisfies ChartConfig

function formatDay(date: string) {
  const [, month, day] = date.split('-')

  return `${day}/${month}`
}

export function TimeseriesChart({ data }: { data: AnalyticsTimeseriesPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualizações e cliques por dia</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatDay}
            />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(value) => formatDay(String(value))} />}
            />
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
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
