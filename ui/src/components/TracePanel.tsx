import { useMemo, useState } from 'react'
import { getTraceSpans } from '../api/telemetryClient'
import type { StoredSpan } from '../types/telemetry'
import { formatAttributePairs, formatDurationMs, formatNanoTimestamp } from '../utils/format'

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
  if (!Number.isFinite(parsed)) {
    return 0
  }
  return parsed
}

function sortByStart(left: StoredSpan, right: StoredSpan): number {
  const leftStart = toNanoValue(left.startTimeUnixNano)
  const rightStart = toNanoValue(right.startTimeUnixNano)
  if (leftStart !== rightStart) {
    return leftStart - rightStart
  }

  return toNanoValue(left.endTimeUnixNano) - toNanoValue(right.endTimeUnixNano)
}

function buildTraceForest(spans: StoredSpan[]): SpanTreeNode[] {
  const spanById = new Set(spans.map((span) => span.spanId))
  const childrenMap = new Map<string, StoredSpan[]>()

  function addChild(parentId: string, child: StoredSpan) {
    const existing = childrenMap.get(parentId)
    if (existing) {
      existing.push(child)
      return
    }
    childrenMap.set(parentId, [child])
  }

  for (const span of spans) {
    const parentId = span.parentSpanId && spanById.has(span.parentSpanId) ? span.parentSpanId : rootKey
    addChild(parentId, span)
  }

  function buildLevel(parentId: string, depth: number): SpanTreeNode[] {
    const level = [...(childrenMap.get(parentId) ?? [])].sort(sortByStart)
    return level.map((span) => ({
      span,
      depth,
      children: buildLevel(span.spanId, depth + 1),
    }))
  }

  return buildLevel(rootKey, 0)
}

function flattenVisibleRows(nodes: SpanTreeNode[], collapsedIds: Set<string>, output: VisibleSpanRow[]) {
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

export function TracePanel() {
  const [traceIdInput, setTraceIdInput] = useState('')
  const [loadedTraceId, setLoadedTraceId] = useState('')
  const [spans, setSpans] = useState<StoredSpan[]>([])
  const [collapsedSpanIds, setCollapsedSpanIds] = useState<Set<string>>(new Set())
  const [selectedSpanId, setSelectedSpanId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (spans.length === 0) {
      return null
    }

    let traceStart = Number.POSITIVE_INFINITY
    let traceEnd = 0

    for (const span of spans) {
      traceStart = Math.min(traceStart, toNanoValue(span.startTimeUnixNano))
      traceEnd = Math.max(traceEnd, toNanoValue(span.endTimeUnixNano))
    }

    if (!Number.isFinite(traceStart) || traceEnd <= traceStart) {
      return null
    }

    return {
      traceStart,
      traceEnd,
      totalDurationNano: traceEnd - traceStart,
    }
  }, [spans])

  const selectedSpan = spans.find((span) => span.spanId === selectedSpanId)

  async function loadByTraceId(nextTraceId: string) {
    setIsLoading(true)
    setError('')

    try {
      const data = await getTraceSpans(nextTraceId)
      setSpans(data)
      setSelectedSpanId(data[0]?.spanId ?? '')
      setCollapsedSpanIds(new Set())
      setLoadedTraceId(nextTraceId)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load trace spans.')
      setSpans([])
      setSelectedSpanId('')
      setCollapsedSpanIds(new Set())
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

  function onToggleCollapsed(spanId: string) {
    setCollapsedSpanIds((previous) => {
      const next = new Set(previous)
      if (next.has(spanId)) {
        next.delete(spanId)
      } else {
        next.add(spanId)
      }
      return next
    })
  }

  function onCollapseAll() {
    setCollapsedSpanIds(new Set(allCollapsibleIds))
  }

  function onExpandAll() {
    setCollapsedSpanIds(new Set())
  }

  function getTimelineStyle(span: StoredSpan): { left: string; width: string } {
    if (!timelineBounds) {
      return { left: '0%', width: '100%' }
    }

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
        <div className="trace-layout">
          <div className="trace-toolbar">
            <p>
              {spans.length} spans total, {visibleRows.length} visible
            </p>
            <div className="trace-toolbar-actions">
              <button type="button" onClick={onCollapseAll} disabled={allCollapsibleIds.length === 0}>
                Collapse All
              </button>
              <button type="button" onClick={onExpandAll} disabled={collapsedSpanIds.size === 0}>
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
                    <div className="trace-tree-cell" style={{ paddingLeft: `${node.depth * 18 + 8}px` }}>
                      {hasChildren ? (
                        <button
                          type="button"
                          className="collapse-toggle"
                          onClick={(event) => {
                            event.stopPropagation()
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