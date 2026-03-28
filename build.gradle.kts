plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.dependencyManagement)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.protobuf)
}

group = "com.github.oxyethylene"
version = "0.1.0"
description = "otel-collector"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
    sourceCompatibility = JavaVersion.VERSION_23
    targetCompatibility = JavaVersion.VERSION_23
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
    implementation("io.grpc:grpc-kotlin-stub:1.4.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")

    implementation("com.google.protobuf:protobuf-java:3.25.3")
    implementation("com.google.protobuf:protobuf-kotlin:3.25.3")

    compileOnly("javax.annotation:javax.annotation-api:1.3.2")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        javaParameters = true
    }
}

// Avoid packaging .proto files as resources to prevent duplicates
// and copy pre-built UI assets into the JAR's static/ folder.
// Build the UI first:  cd ui && npm ci && npm run build
tasks.processResources {
    duplicatesStrategy = org.gradle.api.file.DuplicatesStrategy.EXCLUDE
    exclude("**/*.proto")
    from("ui/dist") {
        into("static")
    }
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
        create("grpckt") {
            artifact = "io.grpc:protoc-gen-grpc-kotlin:1.4.1:jdk8@jar"
        }
    }
    generateProtoTasks {
        all().forEach { task ->
            task.plugins {
                create("grpc")
                create("grpckt")
            }
        }
    }
}

