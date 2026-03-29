package com.github.oxyethylene.otelcollector.storage

import com.github.oxyethylene.otelcollector.model.StoredSpan
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

    fun getRecentTraceIds(limit: Int = 20): List<String> =
        traceInsertionOrder.takeLast(limit).reversed()
}
