plugins {
    id("java")
    alias(libs.plugins.spring.dependencyManagement)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.protobuf)
}

group = "com.github.oxyethylene"
version = "0.0.1-SNAPSHOT"
description = "otel-collector"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")

    implementation(platform("org.springframework.grpc:spring-grpc-dependencies:1.0.2"))
    implementation("org.springframework.grpc:spring-grpc-spring-boot-starter")
    implementation("io.grpc:grpc-netty-shaded")
    modules {
        module("io.grpc:grpc-netty") {
            replacedBy("io.grpc:grpc-netty-shaded", "Use Netty shaded instead of regular Netty")
        }
    }

    implementation(platform(libs.opentelemetry.instrumentationBom))
    implementation("io.opentelemetry.instrumentation:opentelemetry-instrumentation-api")
    implementation("io.opentelemetry.instrumentation:opentelemetry-instrumentation-annotations")

    implementation("io.grpc:grpc-protobuf")
    implementation("io.grpc:grpc-stub")

    implementation("com.google.protobuf:protobuf-java:3.25.3")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    compileOnly("javax.annotation:javax.annotation-api:1.3.2")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")
}

tasks.withType<JavaCompile>() {
    options.compilerArgs.addAll(
        listOf(
            "-parameters",
        )
    )
}

// Avoid packaging .proto files as resources to prevent duplicates
tasks.processResources {
    duplicatesStrategy = org.gradle.api.file.DuplicatesStrategy.EXCLUDE
    exclude("**/*.proto")
}

sourceSets {
    main {
        // Include either copied .proto files or a vendored submodule
        proto {
            srcDirs("src/main/proto", "vendor/opentelemetry-proto")
        }
    }
}

protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.25.3"
    }
    plugins {
        create("grpc") {
            artifact = "io.grpc:protoc-gen-grpc-java:1.65.1"
        }
    }
    generateProtoTasks {
        all().forEach { task ->
            task.plugins {
                create("grpc")
            }
        }
    }
}

