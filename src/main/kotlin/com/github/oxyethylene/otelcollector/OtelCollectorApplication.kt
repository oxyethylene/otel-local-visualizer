package com.github.oxyethylene.otelcollector

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class OtelCollectorApplication

fun main(args: Array<String>) {
    runApplication<OtelCollectorApplication>(*args)
}
