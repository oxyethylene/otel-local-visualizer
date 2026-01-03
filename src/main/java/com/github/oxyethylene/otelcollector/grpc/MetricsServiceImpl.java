package com.github.oxyethylene.otelcollector.grpc;

import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import opentelemetry.proto.collector.metrics.v1.ExportMetricsServiceRequest;
import opentelemetry.proto.collector.metrics.v1.ExportMetricsServiceResponse;
import opentelemetry.proto.collector.metrics.v1.MetricsServiceGrpc;

public class MetricsServiceImpl extends MetricsServiceGrpc.MetricsServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(MetricsServiceImpl.class);

    @Override
    public void export(ExportMetricsServiceRequest request,
            StreamObserver<ExportMetricsServiceResponse> responseObserver) {
        log.info("Received OTLP metrics export");
        ExportMetricsServiceResponse resp = ExportMetricsServiceResponse.getDefaultInstance();
        responseObserver.onNext(resp);
        responseObserver.onCompleted();
    }
}
