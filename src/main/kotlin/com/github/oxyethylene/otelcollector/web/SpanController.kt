package com.github.oxyethylene.otelcollector.web

import com.github.oxyethylene.otelcollector.model.StoredSpan
import com.github.oxyethylene.otelcollector.storage.SpanStore
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class SpanController(private val spanStore: SpanStore) {

    @GetMapping("/traces/recent")
    fun getRecentTraceIds(@RequestParam(defaultValue = "20") limit: Int): ResponseEntity<List<String>> =
        ResponseEntity.ok(spanStore.getRecentTraceIds(limit))

    @GetMapping("/traces/{traceId}/spans")
    fun getSpansByTraceId(@PathVariable traceId: String): ResponseEntity<List<StoredSpan>> {
        val spans = spanStore.findByTraceId(traceId)
        return if (spans.isEmpty()) ResponseEntity.notFound().build()
        else ResponseEntity.ok(spans)
    }

    @GetMapping("/spans/{spanId}")
    fun getSpanById(@PathVariable spanId: String): ResponseEntity<StoredSpan> {
        val span = spanStore.findBySpanId(spanId)
        return if (span == null) ResponseEntity.notFound().build()
        else ResponseEntity.ok(span)
    }
}
