import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRecentTraceSummaries, getTraceSpans } from '../api/telemetryClient'
import type { StoredSpan, TraceSummary } from '../types/telemetry'
import { formatAttributePairs, formatDurationMs, formatNanoTimestamp } from '../utils/format'

// ─── Span tree helpers ────────────────────────────────────────────────────────

interface SpanTreeNode {
  span: StoredSpan
  depth: number
  children: SpanTreeNode[]
}

interface VisibleSpanRow {
  node: SpanTreeNode
  hasChildren: boolean
}

const rootKey = '__root__'

function toNanoValue(rawValue: string): number {
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : 0
}

function sortByStart(left: StoredSpan, right: StoredSpan): number {
  const diff = toNanoValue(left.startTimeUnixNano) - toNanoValue(right.startTimeUnixNano)
  return diff !== 0 ? diff : toNanoValue(left.endTimeUnixNano) - toNanoValue(right.endTimeUnixNano)
}

function buildTraceForest(spans: StoredSpan[]): SpanTreeNode[] {
  const spanById = new Set(spans.map((s) => s.spanId))
  const childrenMap = new Map<string, StoredSpan[]>()

  for (const span of spans) {
    const parentId =
      span.parentSpanId && spanById.has(span.parentSpanId) ? span.parentSpanId : rootKey
    const existing = childrenMap.get(parentId)
    if (existing) existing.push(span)
    else childrenMap.set(parentId, [span])
  }

  function buildLevel(parentId: string, depth: number): SpanTreeNode[] {
    return [...(childrenMap.get(parentId) ?? [])].sort(sortByStart).map((span) => ({
      span,
      depth,
      children: buildLevel(span.spanId, depth + 1),
    }))
  }

  return buildLevel(rootKey, 0)
}

function flattenVisibleRows(
  nodes: SpanTreeNode[],
  collapsedIds: Set<string>,
  output: VisibleSpanRow[],
) {
  for (const node of nodes) {
    const hasChildren = node.children.length > 0
    output.push({ node, hasChildren })
    if (!collapsedIds.has(node.span.spanId)) {
      flattenVisibleRows(node.children, collapsedIds, output)
    }
  }
}

function collectCollapsibleIds(nodes: SpanTreeNode[], output: string[]) {
  for (const node of nodes) {
    if (node.children.length > 0) {
      output.push(node.span.spanId)
      collectCollapsibleIds(node.children, output)
    }
  }
}

// ─── Trace Detail View ────────────────────────────────────────────────────────

interface TraceDetailViewProps {
  traceId: string
  onBack: () => void
}

function TraceDetailView({ traceId, onBack }: TraceDetailViewProps) {
  const [spans, setSpans] = useState<StoredSpan[]>([])
  const [collapsedSpanIds, setCollapsedSpanIds] = useState<Set<string>>(new Set())
  const [selectedSpanId, setSelectedSpanId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSpans = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getTraceSpans(traceId)
      setSpans(data)
      setSelectedSpanId(data[0]?.spanId ?? '')
      setCollapsedSpanIds(new Set())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load trace spans.')
      setSpans([])
      setSelectedSpanId('')
    } finally {
      setIsLoading(false)
    }
  }, [traceId])

  useEffect(() => {
    void loadSpans()
  }, [loadSpans])

  const traceForest = useMemo(() => buildTraceForest(spans), [spans])
  const visibleRows = useMemo(() => {
    const output: VisibleSpanRow[] = []
    flattenVisibleRows(traceForest, collapsedSpanIds, output)
    return output
  }, [traceForest, collapsedSpanIds])

  const allCollapsibleIds = useMemo(() => {
    const output: string[] = []
    collectCollapsibleIds(traceForest, output)
    return output
  }, [traceForest])

  const timelineBounds = useMemo(() => {
    if (spans.length === 0) return null
    let traceStart = Number.POSITIVE_INFINITY
    let traceEnd = 0
    for (const span of spans) {
      traceStart = Math.min(traceStart, toNanoValue(span.startTimeUnixNano))
      traceEnd = Math.max(traceEnd, toNanoValue(span.endTimeUnixNano))
    }
    if (!Number.isFinite(traceStart) || traceEnd <= traceStart) return null
    return { traceStart, traceEnd, totalDurationNano: traceEnd - traceStart }
  }, [spans])

  const selectedSpan = spans.find((s) => s.spanId === selectedSpanId)

  function onToggleCollapsed(spanId: string) {
    setCollapsedSpanIds((prev) => {
      const next = new Set(prev)
      if (next.has(spanId)) next.delete(spanId)
      else next.add(spanId)
      return next
    })
  }

  function getTimelineStyle(span: StoredSpan): { left: string; width: string } {
    if (!timelineBounds) return { left: '0%', width: '100%' }
    const spanStart = toNanoValue(span.startTimeUnixNano)
    const spanEnd = toNanoValue(span.endTimeUnixNano)
    const duration = Math.max(1, spanEnd - spanStart)
    const left = ((spanStart - timelineBounds.traceStart) / timelineBounds.totalDurationNano) * 100
    const width = (duration / timelineBounds.totalDurationNano) * 100
    return {
      left: `${Math.max(0, Math.min(100, left))}%`,
      width: `${Math.max(0.8, Math.min(100, width))}%`,
    }
  }

  return (
    <div className="telemetry-panel">
      <div className="detail-breadcrumb">
        <button type="button" className="back-button" onClick={onBack}>
          ← Recent Traces
        </button>
        <span className="detail-trace-id" title={traceId}>
          {traceId}
        </span>
        <button type="button" className="refresh-inline-button" onClick={() => void loadSpans()} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <h2>Trace Spans</h2>

      {error && <p className="status error">{error}</p>}
      {!error && spans.length === 0 && !isLoading && (
        <p className="status empty">No spans found for this trace.</p>
      )}
      {isLoading && <p className="status empty">Loading…</p>}

      {spans.length > 0 && (
        <div className="trace-layout">
          <div className="trace-toolbar">
            <p>
              {spans.length} spans total, {visibleRows.length} visible
            </p>
            <div className="trace-toolbar-actions">
              <button
                type="button"
                onClick={() => setCollapsedSpanIds(new Set(allCollapsibleIds))}
                disabled={allCollapsibleIds.length === 0}
              >
                Collapse All
              </button>
              <button
                type="button"
                onClick={() => setCollapsedSpanIds(new Set())}
                disabled={collapsedSpanIds.size === 0}
              >
                Expand All
              </button>
            </div>
          </div>

          {timelineBounds && (
            <div className="trace-ruler">
              <span>{formatNanoTimestamp(String(timelineBounds.traceStart))}</span>
              <span>{(timelineBounds.totalDurationNano / 1_000_000).toFixed(3)} ms</span>
              <span>{formatNanoTimestamp(String(timelineBounds.traceEnd))}</span>
            </div>
          )}

          <div className="trace-chart">
            <div className="trace-chart-header">
              <span>Span Tree</span>
              <span>Timeline</span>
            </div>
            <ul className="trace-rows">
              {visibleRows.map(({ node, hasChildren }) => {
                const isCollapsed = collapsedSpanIds.has(node.span.spanId)
                const isSelected = selectedSpanId === node.span.spanId
                return (
                  <li
                    key={node.span.spanId}
                    className={`trace-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedSpanId(node.span.spanId)}
                  >
                    <div
                      className="trace-tree-cell"
                      style={{ paddingLeft: `${node.depth * 18 + 8}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          className="collapse-toggle"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleCollapsed(node.span.spanId)
                          }}
                          aria-label={isCollapsed ? 'Expand span children' : 'Collapse span children'}
                        >
                          {isCollapsed ? '+' : '-'}
                        </button>
                      ) : (
                        <span className="collapse-toggle placeholder" />
                      )}
                      <div>
                        <strong>{node.span.name}</strong>
                        <div className="subtle">
                          {node.span.serviceName || 'unknown'} | {node.span.statusCode || 'UNSET'} |{' '}
                          {formatDurationMs(node.span.startTimeUnixNano, node.span.endTimeUnixNano)}
                        </div>
                      </div>
                    </div>
                    <div className="timeline-cell">
                      <div className="timeline-track" />
                      <div className="timeline-bar" style={getTimelineStyle(node.span)} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {selectedSpan && (
            <div className="trace-details">
              <h3>Selected Span</h3>
              <p>
                <strong>{selectedSpan.name}</strong>
              </p>
              <p className="subtle">spanId={selectedSpan.spanId}</p>
              <p className="subtle">parentSpanId={selectedSpan.parentSpanId || 'root'}</p>
              <p className="subtle">service={selectedSpan.serviceName || 'unknown'}</p>
              <p className="subtle">start={formatNanoTimestamp(selectedSpan.startTimeUnixNano)}</p>
              <p className="subtle">
                duration={formatDurationMs(selectedSpan.startTimeUnixNano, selectedSpan.endTimeUnixNano)}
              </p>
              <p className="subtle">attributes={formatAttributePairs(selectedSpan.attributes)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Trace List View ──────────────────────────────────────────────────────────

interface TraceListViewProps {
  onSelectTrace: (traceId: string) => void
}

function TraceListView({ onSelectTrace }: TraceListViewProps) {
  const [searchInput, setSearchInput] = useState('')
  const [summaries, setSummaries] = useState<TraceSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSummaries = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getRecentTraceSummaries()
      setSummaries(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load recent traces.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummaries()
  }, [loadSummaries])

  function onSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = searchInput.trim()
    if (trimmed) onSelectTrace(trimmed)
  }

  return (
    <div className="telemetry-panel">
      <h2>Traces</h2>
      <p className="panel-description">Search by trace ID or select a recent trace below.</p>

      <form className="search-row" onSubmit={onSearchSubmit}>
        <label htmlFor="trace-search-input">Trace ID</label>
        <input
          id="trace-search-input"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="e.g. 4fd0b5105f53fdb67e4f6a4f7a4386d9"
        />
        <button type="submit" disabled={!searchInput.trim()}>
          Open Trace
        </button>
      </form>

      <div className="recent-traces-section">
        <div className="recent-traces-section-header">
          <h3>Recent Traces</h3>
          <button
            type="button"
            className="refresh-inline-button"
            onClick={() => void loadSummaries()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && <p className="status error">{error}</p>}
        {!error && !isLoading && summaries.length === 0 && (
          <p className="status empty">No traces received yet. Send a request to your service.</p>
        )}

        {summaries.length > 0 && (
          <div className="table-wrap">
            <table className="trace-list-table">
              <thead>
                <tr>
                  <th>Trace ID</th>
                  <th>Service</th>
                  <th>Root Span</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Spans</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr
                    key={summary.traceId}
                    className="trace-list-row"
                    onClick={() => onSelectTrace(summary.traceId)}
                  >
                    <td className="trace-id-cell" title={summary.traceId}>
                      <span className="trace-id-mono">
                        {summary.traceId.length > 16
                          ? `${summary.traceId.slice(0, 8)}…${summary.traceId.slice(-8)}`
                          : summary.traceId}
                      </span>
                    </td>
                    <td>{summary.rootServiceName || '—'}</td>
                    <td>{summary.rootSpanName || '—'}</td>
                    <td className="subtle">{formatNanoTimestamp(String(summary.startTimeUnixNano))}</td>
                    <td>{formatDurationMs(String(summary.startTimeUnixNano), String(summary.endTimeUnixNano))}</td>
                    <td>{summary.spanCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root TracePanel ──────────────────────────────────────────────────────────

export function TracePanel() {
  const [detailTraceId, setDetailTraceId] = useState<string | null>(null)

  if (detailTraceId) {
    return <TraceDetailView traceId={detailTraceId} onBack={() => setDetailTraceId(null)} />
  }
  return <TraceListView onSelectTrace={setDetailTraceId} />
}
