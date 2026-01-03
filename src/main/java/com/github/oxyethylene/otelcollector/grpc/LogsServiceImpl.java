package com.github.oxyethylene.otelcollector.grpc;

import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import opentelemetry.proto.collector.logs.v1.ExportLogsServiceRequest;
import opentelemetry.proto.collector.logs.v1.ExportLogsServiceResponse;
import opentelemetry.proto.collector.logs.v1.LogsServiceGrpc;

public class LogsServiceImpl extends LogsServiceGrpc.LogsServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(LogsServiceImpl.class);

    @Override
    public void export(ExportLogsServiceRequest request, StreamObserver<ExportLogsServiceResponse> responseObserver) {
        log.info("Received OTLP logs export");
        ExportLogsServiceResponse resp = ExportLogsServiceResponse.getDefaultInstance();
        responseObserver.onNext(resp);
        responseObserver.onCompleted();
    }
}
