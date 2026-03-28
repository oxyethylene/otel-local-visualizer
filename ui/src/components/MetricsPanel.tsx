import { useCallback, useEffect, useState } from 'react'
import { getMetricNames, getMetricPoints } from '../api/telemetryClient'
import type { StoredMetricPoint } from '../types/telemetry'
import { formatAttributePairs, formatNanoTimestamp } from '../utils/format'

function metricValueLabel(point: StoredMetricPoint): string {
  if (typeof point.doubleValue === 'number') {
    return `${point.doubleValue}`
  }
  if (typeof point.longValue === 'number') {
    return `${point.longValue}`
  }
  if (typeof point.sum === 'number') {
    return `sum=${point.sum}`
  }
  if (point.count) {
    return `count=${point.count}`
  }
  return 'Complex value'
}

export function MetricsPanel() {
  const [metricNames, setMetricNames] = useState<string[]>([])
  const [selectedMetricName, setSelectedMetricName] = useState('')
  const [loadedMetricName, setLoadedMetricName] = useState('')
  const [points, setPoints] = useState<StoredMetricPoint[]>([])
  const [isLoadingNames, setIsLoadingNames] = useState(false)
  const [isLoadingPoints, setIsLoadingPoints] = useState(false)
  const [error, setError] = useState('')

  const loadNames = useCallback(async () => {
    setIsLoadingNames(true)
    setError('')

    try {
      const names = await getMetricNames()
      const sorted = [...names].sort((left, right) => left.localeCompare(right))
      setMetricNames(sorted)
      setSelectedMetricName((previous) => {
        if (previous) {
          return previous
        }
        return sorted[0] ?? ''
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load metric names.')
      setMetricNames([])
    } finally {
      setIsLoadingNames(false)
    }
  }, [])

  async function loadPoints(metricName: string) {
    setIsLoadingPoints(true)
    setError('')

    try {
      const data = await getMetricPoints(metricName)
      setPoints(data)
      setLoadedMetricName(metricName)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load metric points.')
      setPoints([])
      setLoadedMetricName(metricName)
    } finally {
      setIsLoadingPoints(false)
    }
  }

  useEffect(() => {
    void loadNames()
  }, [loadNames])

  function onLoadClick() {
    if (!selectedMetricName) {
      setError('Select a metric name before loading points.')
      return
    }
    void loadPoints(selectedMetricName)
  }

  function onRefreshClick() {
    if (!loadedMetricName) {
      return
    }
    void loadPoints(loadedMetricName)
  }

  return (
    <div className="telemetry-panel">
      <h2>Metric Points</h2>
      <p className="panel-description">
        Load metric names and points from /api/v1/metrics endpoints.
      </p>

      <div className="input-row">
        <label htmlFor="metric-select">Metric Name</label>
        <select
          id="metric-select"
          value={selectedMetricName}
          onChange={(event) => setSelectedMetricName(event.target.value)}
          disabled={isLoadingNames || metricNames.length === 0}
        >
          {metricNames.length === 0 && <option value="">No metrics available</option>}
          {metricNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onLoadClick}
          disabled={isLoadingPoints || !selectedMetricName}
        >
          {isLoadingPoints ? 'Loading...' : 'Load'}
        </button>
        <button
          type="button"
          onClick={onRefreshClick}
          disabled={isLoadingPoints || !loadedMetricName}
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => void loadNames()}
          disabled={isLoadingNames || isLoadingPoints}
        >
          {isLoadingNames ? 'Refreshing...' : 'Refresh Names'}
        </button>
      </div>

      {error && <p className="status error">{error}</p>}
      {!error && loadedMetricName && points.length === 0 && !isLoadingPoints && (
        <p className="status empty">No points found for metric {loadedMetricName}.</p>
      )}

      {points.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Time</th>
                <th>Service</th>
                <th>Attributes</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={`${point.name}-${point.timeUnixNano}-${index}`}>
                  <td>{point.name}</td>
                  <td>{point.type}</td>
                  <td>{metricValueLabel(point)}</td>
                  <td>{formatNanoTimestamp(point.timeUnixNano)}</td>
                  <td>{point.serviceName || 'unknown'}</td>
                  <td>{formatAttributePairs(point.attributes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
