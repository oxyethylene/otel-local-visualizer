package com.github.oxyethylene.otelcollector.grpc

import io.opentelemetry.proto.collector.trace.v1.ExportTraceServiceRequest
import io.opentelemetry.proto.collector.trace.v1.ExportTraceServiceResponse
import io.opentelemetry.proto.collector.trace.v1.TraceServiceGrpcKt
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class TraceServiceImpl : TraceServiceGrpcKt.TraceServiceCoroutineImplBase() {
    override suspend fun export(request: ExportTraceServiceRequest): ExportTraceServiceResponse {
        log.info("Received OTLP traces export")
        return ExportTraceServiceResponse.getDefaultInstance()
    }

    companion object {
        private val log = LoggerFactory.getLogger(TraceServiceImpl::class.java)
    }
}
