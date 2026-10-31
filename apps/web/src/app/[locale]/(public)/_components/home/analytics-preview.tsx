import { useTranslations } from 'next-intl'

const BAR_HEIGHTS = [38, 62, 46, 78, 54, 92, 70]

const CHART_LINE = 'M0 140C40 126 53 96 91 110s51-41 92-25 61 54 101 13 51-73 90-59 60 35 126-20'

export function AnalyticsPreview() {
  const t = useTranslations('Home.Features')

  return (
    <div className="lynko-chart">
      <div>
        <small>{t('views')}</small>
        <b>12.842</b>
        <em>+24,8%</em>
      </div>
      <svg viewBox="0 0 500 160" role="img" aria-label={t('chartLabel')}>
        <path d={CHART_LINE} />
        <path className="fill" d={`${CHART_LINE}V160H0Z`} />
      </svg>
      <div className="lynko-bars">
        {BAR_HEIGHTS.map((height) => (
          <i key={height} style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  )
}
