export interface StoredSpan {
  traceId: string
  spanId: string
  parentSpanId: string
  name: string
  kind: string
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes: Record<string, string>
  statusCode: string
  statusMessage: string
  serviceName: string
  scopeName: string
}

export interface StoredLog {
  traceId?: string
  spanId?: string
  traceFlags: number
  timeUnixNano: string
  observedTimeUnixNano: string
  severityNumber: number
  severityText: string
  body: string
  attributes: Record<string, string>
  serviceName: string
  scopeName: string
}

export interface StoredMetricPoint {
  name: string
  description: string
  unit: string
  type: string
  startTimeUnixNano: string
  timeUnixNano: string
  attributes: Record<string, string>
  serviceName: string
  scopeName: string
  doubleValue?: number
  longValue?: number
  count?: string
  sum?: number
  min?: number
  max?: number
  bucketCounts?: string[]
  explicitBounds?: number[]
  quantiles?: Record<string, number>
}