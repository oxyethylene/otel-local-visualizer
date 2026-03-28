package com.github.oxyethylene.otelcollector.storage

import com.github.oxyethylene.otelcollector.model.StoredLog
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

@Component
class LogStore {
    private val byTraceId = ConcurrentHashMap<String, CopyOnWriteArrayList<StoredLog>>()
    private val bySpanId = ConcurrentHashMap<String, CopyOnWriteArrayList<StoredLog>>()

    fun store(log: StoredLog) {
        log.traceId?.let { byTraceId.computeIfAbsent(it) { CopyOnWriteArrayList() }.add(log) }
        log.spanId?.let { bySpanId.computeIfAbsent(it) { CopyOnWriteArrayList() }.add(log) }
    }

    fun findByTraceId(traceId: String): List<StoredLog> = byTraceId[traceId] ?: emptyList()

    fun findBySpanId(spanId: String): List<StoredLog> = bySpanId[spanId] ?: emptyList()
}
