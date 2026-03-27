import { useState } from 'react'
import { getTraceSpans } from '../api/telemetryClient'
import type { StoredSpan } from '../types/telemetry'
import { formatAttributePairs, formatDurationMs, formatNanoTimestamp } from '../utils/format'

export function TracePanel() {
  const [traceIdInput, setTraceIdInput] = useState('')
  const [loadedTraceId, setLoadedTraceId] = useState('')
  const [spans, setSpans] = useState<StoredSpan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadByTraceId(nextTraceId: string) {
    setIsLoading(true)
    setError('')

    try {
      const data = await getTraceSpans(nextTraceId)
      setSpans(data)
      setLoadedTraceId(nextTraceId)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load trace spans.')
      setSpans([])
      setLoadedTraceId(nextTraceId)
    } finally {
      setIsLoading(false)
    }
  }

  function onLoadClick() {
    const trimmed = traceIdInput.trim()
    if (!trimmed) {
      setError('Trace id is required before loading spans.')
      return
    }
    void loadByTraceId(trimmed)
  }

  function onRefreshClick() {
    if (!loadedTraceId) {
      return
    }
    void loadByTraceId(loadedTraceId)
  }

  return (
    <div className="telemetry-panel">
      <h2>Trace Spans</h2>
      <p className="panel-description">Load spans from GET /api/v1/traces/{'{traceId}'}/spans.</p>

      <div className="input-row">
        <label htmlFor="trace-id-input">Trace ID</label>
        <input
          id="trace-id-input"
          type="text"
          value={traceIdInput}
          onChange={(event) => setTraceIdInput(event.target.value)}
          placeholder="e.g. 4fd0b5105f53fdb67e4f6a4f7a4386d9"
        />
        <button type="button" onClick={onLoadClick} disabled={isLoading || !traceIdInput.trim()}>
          {isLoading ? 'Loading...' : 'Load'}
        </button>
        <button type="button" onClick={onRefreshClick} disabled={isLoading || !loadedTraceId}>
          Refresh
        </button>
      </div>

      {error && <p className="status error">{error}</p>}
      {!error && loadedTraceId && spans.length === 0 && !isLoading && (
        <p className="status empty">No spans found for trace id {loadedTraceId}.</p>
      )}

      {spans.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Span</th>
                <th>Service</th>
                <th>Status</th>
                <th>Start</th>
                <th>Duration</th>
                <th>Attributes</th>
              </tr>
            </thead>
            <tbody>
              {spans.map((span) => (
                <tr key={span.spanId}>
                  <td>
                    <strong>{span.name}</strong>
                    <div className="subtle">{span.spanId}</div>
                  </td>
                  <td>{span.serviceName || 'unknown'}</td>
                  <td>{span.statusCode || 'UNSET'}</td>
                  <td>{formatNanoTimestamp(span.startTimeUnixNano)}</td>
                  <td>{formatDurationMs(span.startTimeUnixNano, span.endTimeUnixNano)}</td>
                  <td>{formatAttributePairs(span.attributes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}