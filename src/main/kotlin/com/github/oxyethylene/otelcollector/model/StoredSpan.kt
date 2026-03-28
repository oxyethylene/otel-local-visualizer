package com.github.oxyethylene.otelcollector.model

import io.opentelemetry.proto.common.v1.KeyValue
import io.opentelemetry.proto.resource.v1.Resource
import io.opentelemetry.proto.trace.v1.Span
import io.opentelemetry.proto.trace.v1.Status

data class StoredSpan(
    val traceId: String,
    val spanId: String,
    val parentSpanId: String?,
    val traceState: String,
    val name: String,
    val kind: String,
    val startTimeUnixNano: Long,
    val endTimeUnixNano: Long,
    val statusCode: String,
    val statusMessage: String,
    val attributes: Map<String, String>,
    val serviceName: String,
    val scopeName: String,
) {
    companion object {
        fun fromProto(span: Span, resource: Resource, scopeName: String): StoredSpan {
            val parentId = span.parentSpanId.takeUnless { it.isEmpty }?.toHex()
            return StoredSpan(
                traceId = span.traceId.toHex(),
                spanId = span.spanId.toHex(),
                parentSpanId = parentId,
                traceState = span.traceState,
                name = span.name,
                kind = span.kind.name,
                startTimeUnixNano = span.startTimeUnixNano.toLong(),
                endTimeUnixNano = span.endTimeUnixNano.toLong(),
                statusCode = when (span.status.code) {
                    Status.StatusCode.STATUS_CODE_OK -> "OK"
                    Status.StatusCode.STATUS_CODE_ERROR -> "ERROR"
                    else -> "UNSET"
                },
                statusMessage = span.status.message,
                attributes = span.attributesList.toStringMap(),
                serviceName = resource.attributesList.firstOrNull { it.key == "service.name" }
                    ?.value?.stringValue ?: "",
                scopeName = scopeName,
            )
        }

        private fun com.google.protobuf.ByteString.toHex(): String =
            toByteArray().joinToString("") { "%02x".format(it) }

        private fun List<KeyValue>.toStringMap(): Map<String, String> =
            associate { it.key to it.value.stringValue }
    }
}
