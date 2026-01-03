package com.github.oxyethylene.otelcollector.grpc;

import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OtlpGrpcServer implements ApplicationRunner, DisposableBean {
    private static final Logger log = LoggerFactory.getLogger(OtlpGrpcServer.class);

    private Server server;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        int port = Integer.getInteger("otlp.grpc.port", 4317);
        try {
            server = NettyServerBuilder.forPort(port)
                    .addService(new TraceServiceImpl())
                    .addService(new MetricsServiceImpl())
                    .addService(new LogsServiceImpl())
                    .build()
                    .start();
            log.info("OTLP gRPC server started on port {}", port);
        } catch (IOException e) {
            throw new RuntimeException("Failed to start OTLP gRPC server", e);
        }
    }

    @Override
    public void destroy() {
        if (server != null) {
            server.shutdown();
            log.info("OTLP gRPC server stopped");
        }
    }
}
