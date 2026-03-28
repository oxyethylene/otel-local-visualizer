import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { StoredMetricPoint } from '../types/telemetry'

const LINE_COLORS = [
  '#3c7a9d',
  '#e05c3a',
  '#2db37a',
  '#b35cce',
  '#d4a030',
  '#5c8fce',
  '#ce5c7a',
  '#4ab89e',
]

function formatMs(timeUnixNano: string): string {
  const ms = Number(timeUnixNano) / 1e6
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function numericValue(point: StoredMetricPoint): number | undefined {
  if (typeof point.doubleValue === 'number') return point.doubleValue
  if (typeof point.longValue === 'number') return point.longValue
  return undefined
}

function seriesKey(point: StoredMetricPoint): string {
  return `${point.serviceName}|${JSON.stringify(point.attributes)}`
}

interface LineChartData {
  time: string
  [key: string]: number | string | undefined
}

function buildLineData(points: StoredMetricPoint[]): {
  data: LineChartData[]
  seriesKeys: string[]
} {
  const sorted = [...points].sort((a, b) =>
    Number(a.timeUnixNano) < Number(b.timeUnixNano) ? -1 : 1,
  )

  const keysOrdered: string[] = []
  const keySet = new Set<string>()
  for (const p of sorted) {
    const k = seriesKey(p)
    if (!keySet.has(k)) {
      keySet.add(k)
      keysOrdered.push(k)
    }
  }

  // Group by timestamp
  const byTime = new Map<string, LineChartData>()
  for (const p of sorted) {
    const time = formatMs(p.timeUnixNano)
    if (!byTime.has(time)) byTime.set(time, { time })
    const row = byTime.get(time)!
    const val = numericValue(p)
    if (val !== undefined) row[seriesKey(p)] = val
  }

  return { data: Array.from(byTime.values()), seriesKeys: keysOrdered }
}

interface BucketBar {
  label: string
  count: number
}

function buildHistogramData(point: StoredMetricPoint): BucketBar[] {
  const bounds = point.explicitBounds ?? []
  const counts = (point.bucketCounts ?? []).map(Number)
  const bars: BucketBar[] = []
  for (let i = 0; i < counts.length; i++) {
    const label = i < bounds.length ? `≤${bounds[i]}` : '+∞'
    bars.push({ label, count: counts[i] })
  }
  return bars
}

interface QuantileBar {
  quantile: string
  value: number
}

function buildSummaryData(point: StoredMetricPoint): QuantileBar[] {
  if (!point.quantiles) return []
  return Object.entries(point.quantiles).map(([q, v]) => ({
    quantile: `p${Math.round(Number(q) * 100)}`,
    value: v,
  }))
}

function latestPoint(points: StoredMetricPoint[]): StoredMetricPoint {
  return points.reduce((best, p) =>
    Number(p.timeUnixNano) > Number(best.timeUnixNano) ? p : best,
  )
}

interface Props {
  points: StoredMetricPoint[]
}

export function MetricChart({ points }: Props) {
  if (points.length === 0) return null

  const type = points[0].type
  const metricName = points[0].name

  if (type === 'GAUGE' || type === 'SUM') {
    const { data, seriesKeys } = buildLineData(points)
    return (
      <div className="metric-chart">
        <div className="metric-chart-title">
          {metricName} ({type})
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde7ee" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={60} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
            {seriesKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'HISTOGRAM' || type === 'EXPONENTIAL_HISTOGRAM') {
    const latest = latestPoint(points)
    const data = buildHistogramData(latest)
    const titleExtra =
      [
        latest.count !== undefined ? `count=${latest.count}` : null,
        latest.sum !== undefined ? `sum=${latest.sum}` : null,
        latest.min !== undefined ? `min=${latest.min}` : null,
        latest.max !== undefined ? `max=${latest.max}` : null,
      ]
        .filter(Boolean)
        .join(', ') || ''
    return (
      <div className="metric-chart">
        <div className="metric-chart-title">
          {metricName} ({type}){titleExtra ? ` — ${titleExtra}` : ''}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde7ee" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={60} />
            <Tooltip />
            <Bar dataKey="count" fill="#3c7a9d" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'SUMMARY') {
    const latest = latestPoint(points)
    const data = buildSummaryData(latest)
    return (
      <div className="metric-chart">
        <div className="metric-chart-title">
          {metricName} ({type})
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 20, left: 40, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#dde7ee" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="quantile" tick={{ fontSize: 11 }} width={40} />
            <Tooltip />
            <Bar dataKey="value" fill="#3c7a9d" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}
