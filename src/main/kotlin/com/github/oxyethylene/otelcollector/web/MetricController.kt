package com.github.oxyethylene.otelcollector.web

import com.github.oxyethylene.otelcollector.model.StoredMetricPoint
import com.github.oxyethylene.otelcollector.storage.MetricStore
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController

@RestController
class MetricController(private val metricStore: MetricStore) {

    @GetMapping("/metrics")
    fun listMetricNames(): ResponseEntity<Set<String>> =
        ResponseEntity.ok(metricStore.listMetricNames())

    @GetMapping("/metrics/{metricName}")
    fun getMetricByName(@PathVariable metricName: String): ResponseEntity<List<StoredMetricPoint>> {
        val points = metricStore.findByMetricName(metricName)
        return if (points.isEmpty()) ResponseEntity.notFound().build()
        else ResponseEntity.ok(points)
    }
}
