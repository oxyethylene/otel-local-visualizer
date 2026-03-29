package com.github.oxyethylene.otelcollector.storage

import com.github.oxyethylene.otelcollector.model.StoredSpan
import com.github.oxyethylene.otelcollector.model.TraceSummary
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

@Component
class SpanStore {
    private val byTraceId = ConcurrentHashMap<String, CopyOnWriteArrayList<StoredSpan>>()
    private val bySpanId = ConcurrentHashMap<String, StoredSpan>()
    private val traceInsertionOrder = CopyOnWriteArrayList<String>()

    fun store(span: StoredSpan) {
        bySpanId[span.spanId] = span
        byTraceId.computeIfAbsent(span.traceId) {
            traceInsertionOrder.add(span.traceId)
            CopyOnWriteArrayList()
        }.add(span)
    }

    fun findByTraceId(traceId: String): List<StoredSpan> =
        byTraceId[traceId] ?: emptyList()

    fun findBySpanId(spanId: String): StoredSpan? =
        bySpanId[spanId]

    fun getRecentTraceSummaries(limit: Int = 20): List<TraceSummary> =
        traceInsertionOrder.takeLast(limit).reversed().mapNotNull { traceId ->
            val spans = byTraceId[traceId] ?: return@mapNotNull null
            val rootSpan = spans.firstOrNull { it.parentSpanId.isNullOrBlank() }
                ?: spans.minByOrNull { it.startTimeUnixNano }
                ?: return@mapNotNull null
            TraceSummary(
                traceId = traceId,
                rootServiceName = rootSpan.serviceName,
                rootSpanName = rootSpan.name,
                startTimeUnixNano = spans.minOf { it.startTimeUnixNano },
                endTimeUnixNano = spans.maxOf { it.endTimeUnixNano },
                spanCount = spans.size,
            )
        }
}
