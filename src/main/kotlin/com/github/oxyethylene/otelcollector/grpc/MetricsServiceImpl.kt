package com.github.oxyethylene.otelcollector.grpc

import io.opentelemetry.proto.collector.metrics.v1.ExportMetricsServiceRequest
import io.opentelemetry.proto.collector.metrics.v1.ExportMetricsServiceResponse
import io.opentelemetry.proto.collector.metrics.v1.MetricsServiceGrpcKt
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class MetricsServiceImpl : MetricsServiceGrpcKt.MetricsServiceCoroutineImplBase() {
    override suspend fun export(request: ExportMetricsServiceRequest): ExportMetricsServiceResponse {
        log.info("Received OTLP metrics export")
        return ExportMetricsServiceResponse.getDefaultInstance()
    }

    companion object {
        private val log = LoggerFactory.getLogger(MetricsServiceImpl::class.java)
    }
}
