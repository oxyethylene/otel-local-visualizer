package com.github.oxyethylene.otelcollector.web

import com.github.oxyethylene.otelcollector.model.StoredLog
import com.github.oxyethylene.otelcollector.storage.LogStore
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController

@RestController
class LogController(private val logStore: LogStore) {

    @GetMapping("/traces/{traceId}/logs")
    fun getLogsByTraceId(@PathVariable traceId: String): ResponseEntity<List<StoredLog>> {
        val logs = logStore.findByTraceId(traceId)
        return if (logs.isEmpty()) ResponseEntity.notFound().build()
        else ResponseEntity.ok(logs)
    }

    @GetMapping("/spans/{spanId}/logs")
    fun getLogsBySpanId(@PathVariable spanId: String): ResponseEntity<List<StoredLog>> {
        val logs = logStore.findBySpanId(spanId)
        return if (logs.isEmpty()) ResponseEntity.notFound().build()
        else ResponseEntity.ok(logs)
    }
}
