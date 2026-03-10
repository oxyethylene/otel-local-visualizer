package com.github.oxyethylene.otelcollector.storage

import com.github.oxyethylene.otelcollector.model.StoredMetricPoint
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

@Component
class MetricStore {
    private val byMetricName = ConcurrentHashMap<String, CopyOnWriteArrayList<StoredMetricPoint>>()

    fun store(point: StoredMetricPoint) {
        byMetricName.computeIfAbsent(point.name) { CopyOnWriteArrayList() }.add(point)
    }

    fun findByMetricName(name: String): List<StoredMetricPoint> =
        byMetricName[name] ?: emptyList()

    fun listMetricNames(): Set<String> = byMetricName.keys
}
