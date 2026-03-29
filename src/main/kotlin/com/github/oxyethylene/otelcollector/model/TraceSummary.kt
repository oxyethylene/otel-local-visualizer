package com.github.oxyethylene.otelcollector.model

data class TraceSummary(
    val traceId: String,
    val rootServiceName: String,
    val rootSpanName: String,
    val startTimeUnixNano: Long,
    val endTimeUnixNano: Long,
    val spanCount: Int,
)
