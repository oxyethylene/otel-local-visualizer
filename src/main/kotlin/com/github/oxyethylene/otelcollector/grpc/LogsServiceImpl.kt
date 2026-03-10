package com.github.oxyethylene.otelcollector.grpc

import io.opentelemetry.proto.collector.logs.v1.ExportLogsServiceRequest
import io.opentelemetry.proto.collector.logs.v1.ExportLogsServiceResponse
import io.opentelemetry.proto.collector.logs.v1.LogsServiceGrpcKt
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class LogsServiceImpl : LogsServiceGrpcKt.LogsServiceCoroutineImplBase() {
    override suspend fun export(request: ExportLogsServiceRequest): ExportLogsServiceResponse {
        log.info("Received OTLP logs export")
        return ExportLogsServiceResponse.getDefaultInstance()
    }

    companion object {
        private val log = LoggerFactory.getLogger(LogsServiceImpl::class.java)
    }
}
