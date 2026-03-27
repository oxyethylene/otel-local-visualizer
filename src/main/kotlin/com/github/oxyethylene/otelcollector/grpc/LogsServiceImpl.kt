package com.github.oxyethylene.otelcollector.grpc

import com.github.oxyethylene.otelcollector.model.StoredLog
import com.github.oxyethylene.otelcollector.storage.LogStore
import io.opentelemetry.proto.collector.logs.v1.ExportLogsServiceRequest
import io.opentelemetry.proto.collector.logs.v1.ExportLogsServiceResponse
import io.opentelemetry.proto.collector.logs.v1.LogsServiceGrpcKt
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class LogsServiceImpl(private val logStore: LogStore) : LogsServiceGrpcKt.LogsServiceCoroutineImplBase() {
    override suspend fun export(request: ExportLogsServiceRequest): ExportLogsServiceResponse {
        request.resourceLogsList.forEach { resourceLogs ->
            val resource = resourceLogs.resource
            resourceLogs.scopeLogsList.forEach { scopeLogs ->
                val scopeName = scopeLogs.scope.name
                scopeLogs.logRecordsList.forEach { logRecord ->
                    logStore.store(StoredLog.fromProto(logRecord, resource, scopeName))
                }
            }
        }
        log.debug("Received OTLP logs export")
        return ExportLogsServiceResponse.getDefaultInstance()
    }

    companion object {
        private val log = LoggerFactory.getLogger(LogsServiceImpl::class.java)
    }
}
