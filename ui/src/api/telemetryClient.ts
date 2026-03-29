import type { StoredLog, StoredMetricPoint, StoredSpan } from '../types/telemetry'

const apiPrefix = '/api/v1'

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiPrefix}${path}`)
  if (!response.ok) {
    const bodyText = await response.text()
    const message = bodyText
      ? `${response.status} ${response.statusText}: ${bodyText}`
      : `${response.status} ${response.statusText}`
    throw new Error(`Request failed for ${path}. ${message}`)
  }
  return (await response.json()) as T
}

export function getRecentTraceIds(limit: number = 20): Promise<string[]> {
  return fetchJson<string[]>(`/traces/recent?limit=${limit}`)
}

export function getTraceSpans(traceId: string): Promise<StoredSpan[]> {
  return fetchJson<StoredSpan[]>(`/traces/${encodeURIComponent(traceId)}/spans`)
}

export function getTraceLogs(traceId: string): Promise<StoredLog[]> {
  return fetchJson<StoredLog[]>(`/traces/${encodeURIComponent(traceId)}/logs`)
}

export function getMetricNames(): Promise<string[]> {
  return fetchJson<string[]>(`/metrics`)
}

export function getMetricPoints(metricName: string): Promise<StoredMetricPoint[]> {
  return fetchJson<StoredMetricPoint[]>(`/metrics/${encodeURIComponent(metricName)}`)
}
