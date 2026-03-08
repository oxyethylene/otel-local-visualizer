# OTel Local Visualizer — Agent Guide

## Project Overview

A single-executable Spring Boot JAR that acts as a local OpenTelemetry collector. It receives **Traces**, **Logs**, and **Metrics** over OTLP/gRPC and visualizes them during local development. It is not intended for production use.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 25 |
| Framework | Spring Boot (Web MVC) |
| gRPC | `spring-grpc-spring-boot-starter` |
| Build | Gradle (Kotlin DSL) |
| Protobuf | `protobuf-java` 3.25.3 |
| Boilerplate | Lombok |

## Repository Layout

```
src/
  main/
    java/com/github/oxyethylene/otelcollector/
      OtelCollectorApplication.java        # Spring Boot entry point
      config/
        WebMvcConfiguration.java           # Prefixes all @RestControllers under /api/v1
      grpc/
        TraceServiceImpl.java              # Handles OTLP trace exports
        LogsServiceImpl.java               # Handles OTLP log exports
        MetricsServiceImpl.java            # Handles OTLP metrics exports
    proto/                                 # .proto source files (OTLP collector protos)
    resources/
      application.yaml                     # Base config (app name, banner off)
      application-local.yaml              # Local profile: debug logging
  test/
    java/.../OtelCollectorApplicationTests.java
http-request/
  default.http                             # IntelliJ HTTP Client scratch requests
build.gradle.kts                           # Dependencies, protobuf codegen config
settings.gradle.kts                        # Root project name: otel-local-visualizer
```

## Key Design Decisions

- **gRPC port**: defaults to `4317` (standard OTLP port); configured via `spring.grpc.server.port` in `application.yaml` or `-Dspring.grpc.server.port=<port>`.
- **HTTP API prefix**: all `@RestController` endpoints are automatically prefixed with `/api/v1` via `WebMvcConfiguration`.
- **Proto codegen**: `.proto` files live in `src/main/proto` (and optionally `vendor/opentelemetry-proto`). The Gradle protobuf plugin generates Java stubs + gRPC service bases at build time.
- **Resource deduplication**: `.proto` files are excluded from the final JAR resources to avoid duplicate-entry errors.

## Build & Run

```bash
# Build the fat JAR
./gradlew bootJar

# Run locally (enables debug logging)
./gradlew bootRun --args='--spring.profiles.active=local'

# Or run the fat JAR directly
java -jar build/libs/otel-local-visualizer-0.0.1-SNAPSHOT.jar
```

## Configuring Your App to Send Telemetry Here

Point your OTLP exporter at this collector:

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

## Adding New Features

- **New REST endpoint**: add a `@RestController` — it will automatically be served under `/api/v1/…`.
- **New gRPC service**: implement the generated `*ImplBase`, annotate it with `@Service`, and it will be automatically registered.
- **New proto types**: add `.proto` files under `src/main/proto` and run `./gradlew generateProto`.
