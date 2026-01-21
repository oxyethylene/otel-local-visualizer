package com.github.oxyethylene.otelcollector.grpc;

import io.grpc.stub.StreamObserver;
import io.opentelemetry.proto.collector.trace.v1.ExportTraceServiceRequest;
import io.opentelemetry.proto.collector.trace.v1.ExportTraceServiceResponse;
import io.opentelemetry.proto.collector.trace.v1.TraceServiceGrpc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TraceServiceImpl extends TraceServiceGrpc.TraceServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(TraceServiceImpl.class);

    @Override
    public void export(ExportTraceServiceRequest request, StreamObserver<ExportTraceServiceResponse> responseObserver) {
        log.info("Received OTLP traces export");
        ExportTraceServiceResponse resp = ExportTraceServiceResponse.getDefaultInstance();
        responseObserver.onNext(resp);
        responseObserver.onCompleted();
    }
}
