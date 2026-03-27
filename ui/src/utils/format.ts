export function formatNanoTimestamp(nanoValue: string): string {
  const asNumber = Number(nanoValue)
  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return 'N/A'
  }

  const millis = Math.trunc(asNumber / 1_000_000)
  return new Date(millis).toLocaleString()
}

export function formatDurationMs(startNano: string, endNano: string): string {
  const start = Number(startNano)
  const end = Number(endNano)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 'N/A'
  }

  const durationMs = (end - start) / 1_000_000
  return `${durationMs.toFixed(3)} ms`
}

export function formatAttributePairs(attributes: Record<string, string>): string {
  const entries = Object.entries(attributes)
  if (entries.length === 0) {
    return 'None'
  }

  return entries
    .slice(0, 6)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
}