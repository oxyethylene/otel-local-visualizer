import { useState } from 'react'
import { getTraceLogs } from '../api/telemetryClient'
import type { StoredLog } from '../types/telemetry'
import { formatAttributePairs, formatNanoTimestamp } from '../utils/format'

export function LogsPanel() {
  const [traceIdInput, setTraceIdInput] = useState('')
  const [loadedTraceId, setLoadedTraceId] = useState('')
  const [logs, setLogs] = useState<StoredLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadByTraceId(nextTraceId: string) {
    setIsLoading(true)
    setError('')

    try {
      const data = await getTraceLogs(nextTraceId)
      setLogs(data)
      setLoadedTraceId(nextTraceId)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load logs.')
      setLogs([])
      setLoadedTraceId(nextTraceId)
    } finally {
      setIsLoading(false)
    }
  }

  function onLoadClick() {
    const trimmed = traceIdInput.trim()
    if (!trimmed) {
      setError('Trace id is required before loading logs.')
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
      <h2>Trace Logs</h2>
      <p className="panel-description">Load logs from GET /api/v1/traces/{'{traceId}'}/logs.</p>

      <div className="input-row">
        <label htmlFor="logs-trace-id-input">Trace ID</label>
        <input
          id="logs-trace-id-input"
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
      {!error && loadedTraceId && logs.length === 0 && !isLoading && (
        <p className="status empty">No logs found for trace id {loadedTraceId}.</p>
      )}

      {logs.length > 0 && (
        <ul className="log-list">
          {logs.map((log, index) => (
            <li key={`${log.timeUnixNano}-${index}`} className="log-item">
              <div className="log-row">
                <span className="badge">{log.severityText || `SEV-${log.severityNumber}`}</span>
                <span>{formatNanoTimestamp(log.timeUnixNano)}</span>
              </div>
              <p className="log-body">{log.body || 'No body'}</p>
              <p className="subtle">
                service={log.serviceName || 'unknown'}, scope={log.scopeName || 'unknown'}
              </p>
              <p className="subtle">{formatAttributePairs(log.attributes)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
