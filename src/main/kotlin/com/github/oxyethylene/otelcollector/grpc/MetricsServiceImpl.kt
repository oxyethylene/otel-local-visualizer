package com.github.oxyethylene.otelcollector.grpc

import com.github.oxyethylene.otelcollector.model.StoredMetricPoint
import com.github.oxyethylene.otelcollector.storage.MetricStore
import io.opentelemetry.proto.collector.metrics.v1.ExportMetricsServiceRequest
import io.opentelemetry.proto.collector.metrics.v1.ExportMetricsServiceResponse
import io.opentelemetry.proto.collector.metrics.v1.MetricsServiceGrpcKt
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class MetricsServiceImpl(private val metricStore: MetricStore) : MetricsServiceGrpcKt.MetricsServiceCoroutineImplBase() {
    override suspend fun export(request: ExportMetricsServiceRequest): ExportMetricsServiceResponse {
        log.debug("Received OTLP metrics export")
        for (resourceMetrics in request.resourceMetricsList) {
            val resource = resourceMetrics.resource
            for (scopeMetrics in resourceMetrics.scopeMetricsList) {
                val scopeName = scopeMetrics.scope.name
                for (metric in scopeMetrics.metricsList) {
                    StoredMetricPoint.fromProto(metric, resource, scopeName)
                        .forEach(metricStore::store)
                }
            }
        }
        return ExportMetricsServiceResponse.getDefaultInstance()
    }

    companion object {
        private val log = LoggerFactory.getLogger(MetricsServiceImpl::class.java)
    }
}
