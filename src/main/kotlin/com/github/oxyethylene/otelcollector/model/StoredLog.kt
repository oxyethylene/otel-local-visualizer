package com.github.oxyethylene.otelcollector.model

import tools.jackson.databind.ObjectMapper
import com.google.protobuf.ByteString
import io.opentelemetry.proto.common.v1.KeyValue
import io.opentelemetry.proto.logs.v1.LogRecord
import io.opentelemetry.proto.resource.v1.Resource

data class StoredLog(
    val traceId: String?,
    val spanId: String?,
    val traceFlags: String,
    val timeUnixNano: Long,
    val observedTimeUnixNano: Long,
    val severityNumber: Int,
    val severityText: String,
    val body: String,
    val attributes: Map<String, String>,
    val serviceName: String,
    val scopeName: String,
    // Logstash-parsed fields (null when body is not logstash JSON)
    val atTimestamp: String?,
    val message: String?,
    val loggerName: String?,
    val threadName: String?,
    val level: String?,
    val levelValue: Int?,
) {
    companion object {
        private val objectMapper = ObjectMapper()

        fun fromProto(logRecord: LogRecord, resource: Resource, scopeName: String): StoredLog {
            val traceId = logRecord.traceId.takeUnless { it.isEmpty }?.toHex()
            val spanId = logRecord.spanId.takeUnless { it.isEmpty }?.toHex()
            val bodyStr = if (logRecord.body.hasStringValue()) logRecord.body.stringValue else ""
            val logstash = tryParseLogstash(bodyStr)

            return StoredLog(
                traceId = traceId,
                spanId = spanId,
                traceFlags = "%02x".format(logRecord.flags and 0xFF),
                timeUnixNano = logRecord.timeUnixNano,
                observedTimeUnixNano = logRecord.observedTimeUnixNano,
                severityNumber = logRecord.severityNumberValue,
                severityText = logRecord.severityText,
                body = bodyStr,
                attributes = logRecord.attributesList.toStringMap(),
                serviceName = resource.attributesList.firstOrNull { it.key == "service.name" }
                    ?.value?.stringValue ?: "",
                scopeName = scopeName,
                atTimestamp = logstash?.get("@timestamp"),
                message = logstash?.get("message"),
                loggerName = logstash?.get("logger_name"),
                threadName = logstash?.get("thread_name"),
                level = logstash?.get("level"),
                levelValue = logstash?.get("level_value")?.toIntOrNull(),
            )
        }

        private fun tryParseLogstash(body: String): Map<String, String>? {
            if (!body.startsWith("{")) return null
            return try {
                @Suppress("UNCHECKED_CAST")
                (objectMapper.readValue(body, Map::class.java) as Map<*, *>)
                    .entries.associate { it.key.toString() to (it.value?.toString() ?: "") }
            } catch (_: Exception) {
                null
            }
        }

        private fun ByteString.toHex(): String =
            toByteArray().joinToString("") { "%02x".format(it) }

        private fun List<KeyValue>.toStringMap(): Map<String, String> =
            associate { it.key to it.value.stringValue }
    }
}
