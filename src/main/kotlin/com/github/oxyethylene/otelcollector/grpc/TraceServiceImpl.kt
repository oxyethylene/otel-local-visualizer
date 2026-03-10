package com.github.oxyethylene.otelcollector.grpc

import com.github.oxyethylene.otelcollector.model.StoredSpan
import com.github.oxyethylene.otelcollector.storage.SpanStore
import io.opentelemetry.proto.collector.trace.v1.ExportTraceServiceRequest
import io.opentelemetry.proto.collector.trace.v1.ExportTraceServiceResponse
import io.opentelemetry.proto.collector.trace.v1.TraceServiceGrpcKt
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class TraceServiceImpl(private val spanStore: SpanStore) : TraceServiceGrpcKt.TraceServiceCoroutineImplBase() {
    override suspend fun export(request: ExportTraceServiceRequest): ExportTraceServiceResponse {
        var count = 0
        for (resourceSpans in request.resourceSpansList) {
            val resource = resourceSpans.resource
            for (scopeSpans in resourceSpans.scopeSpansList) {
                val scopeName = scopeSpans.scope.name
                for (span in scopeSpans.spansList) {
                    spanStore.store(StoredSpan.fromProto(span, resource, scopeName))
                    count++
                }
            }
        }
        log.info("Stored {} span(s) from OTLP traces export", count)
        return ExportTraceServiceResponse.getDefaultInstance()
    }

    companion object {
        private val log = LoggerFactory.getLogger(TraceServiceImpl::class.java)
    }
}
