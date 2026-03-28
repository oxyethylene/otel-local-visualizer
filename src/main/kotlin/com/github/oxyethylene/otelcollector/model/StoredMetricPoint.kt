package com.github.oxyethylene.otelcollector.model

import com.google.protobuf.ByteString
import io.opentelemetry.proto.common.v1.KeyValue
import io.opentelemetry.proto.metrics.v1.Metric
import io.opentelemetry.proto.resource.v1.Resource

data class StoredMetricPoint(
    val name: String,
    val description: String,
    val unit: String,
    val type: String,
    val startTimeUnixNano: Long,
    val timeUnixNano: Long,
    val attributes: Map<String, String>,
    val serviceName: String,
    val scopeName: String,
    // Gauge / Sum
    val doubleValue: Double?,
    val longValue: Long?,
    // Histogram / ExponentialHistogram / Summary
    val count: Long?,
    val sum: Double?,
    val min: Double?,
    val max: Double?,
    // Histogram-specific
    val bucketCounts: List<Long>?,
    val explicitBounds: List<Double>?,
    // Summary-specific
    val quantiles: Map<Double, Double>?,
) {
    companion object {
        fun fromProto(metric: Metric, resource: Resource, scopeName: String): List<StoredMetricPoint> {
            val common = CommonMetricFields(
                name = metric.name,
                description = metric.description,
                unit = metric.unit,
                serviceName = resource.attributesList.firstOrNull { it.key == "service.name" }
                    ?.value?.stringValue ?: "",
                scopeName = scopeName,
            )
            return when {
                metric.hasGauge() -> metric.gauge.dataPointsList.map { dp ->
                    StoredMetricPoint(
                        name = common.name,
                        description = common.description,
                        unit = common.unit,
                        type = "GAUGE",
                        startTimeUnixNano = dp.startTimeUnixNano.toLong(),
                        timeUnixNano = dp.timeUnixNano.toLong(),
                        attributes = dp.attributesList.toStringMap(),
                        serviceName = common.serviceName,
                        scopeName = common.scopeName,
                        doubleValue = if (dp.hasAsDouble()) dp.asDouble else null,
                        longValue = if (dp.hasAsInt()) dp.asInt else null,
                        count = null, sum = null, min = null, max = null,
                        bucketCounts = null, explicitBounds = null, quantiles = null,
                    )
                }
                metric.hasSum() -> metric.sum.dataPointsList.map { dp ->
                    StoredMetricPoint(
                        name = common.name,
                        description = common.description,
                        unit = common.unit,
                        type = "SUM",
                        startTimeUnixNano = dp.startTimeUnixNano.toLong(),
                        timeUnixNano = dp.timeUnixNano.toLong(),
                        attributes = dp.attributesList.toStringMap(),
                        serviceName = common.serviceName,
                        scopeName = common.scopeName,
                        doubleValue = if (dp.hasAsDouble()) dp.asDouble else null,
                        longValue = if (dp.hasAsInt()) dp.asInt else null,
                        count = null, sum = null, min = null, max = null,
                        bucketCounts = null, explicitBounds = null, quantiles = null,
                    )
                }
                metric.hasHistogram() -> metric.histogram.dataPointsList.map { dp ->
                    StoredMetricPoint(
                        name = common.name,
                        description = common.description,
                        unit = common.unit,
                        type = "HISTOGRAM",
                        startTimeUnixNano = dp.startTimeUnixNano.toLong(),
                        timeUnixNano = dp.timeUnixNano.toLong(),
                        attributes = dp.attributesList.toStringMap(),
                        serviceName = common.serviceName,
                        scopeName = common.scopeName,
                        doubleValue = null, longValue = null,
                        count = dp.count.toLong(),
                        sum = if (dp.hasSum()) dp.sum else null,
                        min = if (dp.hasMin()) dp.min else null,
                        max = if (dp.hasMax()) dp.max else null,
                        bucketCounts = dp.bucketCountsList.map { it.toLong() },
                        explicitBounds = dp.explicitBoundsList.toList(),
                        quantiles = null,
                    )
                }
                metric.hasExponentialHistogram() -> metric.exponentialHistogram.dataPointsList.map { dp ->
                    StoredMetricPoint(
                        name = common.name,
                        description = common.description,
                        unit = common.unit,
                        type = "EXPONENTIAL_HISTOGRAM",
                        startTimeUnixNano = dp.startTimeUnixNano.toLong(),
                        timeUnixNano = dp.timeUnixNano.toLong(),
                        attributes = dp.attributesList.toStringMap(),
                        serviceName = common.serviceName,
                        scopeName = common.scopeName,
                        doubleValue = null, longValue = null,
                        count = dp.count.toLong(),
                        sum = if (dp.hasSum()) dp.sum else null,
                        min = if (dp.hasMin()) dp.min else null,
                        max = if (dp.hasMax()) dp.max else null,
                        bucketCounts = null, explicitBounds = null, quantiles = null,
                    )
                }
                metric.hasSummary() -> metric.summary.dataPointsList.map { dp ->
                    StoredMetricPoint(
                        name = common.name,
                        description = common.description,
                        unit = common.unit,
                        type = "SUMMARY",
                        startTimeUnixNano = dp.startTimeUnixNano.toLong(),
                        timeUnixNano = dp.timeUnixNano.toLong(),
                        attributes = dp.attributesList.toStringMap(),
                        serviceName = common.serviceName,
                        scopeName = common.scopeName,
                        doubleValue = null, longValue = null,
                        count = dp.count.toLong(),
                        sum = dp.sum,
                        min = null, max = null,
                        bucketCounts = null, explicitBounds = null,
                        quantiles = dp.quantileValuesList.associate { it.quantile to it.value },
                    )
                }
                else -> emptyList()
            }
        }

        private data class CommonMetricFields(
            val name: String,
            val description: String,
            val unit: String,
            val serviceName: String,
            val scopeName: String,
        )

        private fun List<KeyValue>.toStringMap(): Map<String, String> =
            associate { it.key to it.value.stringValue }
    }
}
