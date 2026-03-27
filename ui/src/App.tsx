function App() {
  return (
    <div className="app">
      <header>
        <h1>OTel Collector</h1>
        <p className="subtitle">OpenTelemetry Collector &mdash; In-Memory Mode</p>
      </header>
      <main>
        <div className="card-grid">
          <div className="card">
            <h2>Traces</h2>
            <p>Distributed traces collected via OTLP/gRPC on port 4317</p>
            <code>GET /api/v1/traces/&#123;traceId&#125;/spans</code>
          </div>
          <div className="card">
            <h2>Metrics</h2>
            <p>Gauge, Sum, Histogram, and Summary metric points</p>
            <code>GET /api/v1/metrics</code>
          </div>
          <div className="card">
            <h2>Logs</h2>
            <p>Structured log records with severity and attributes</p>
            <code>GET /api/v1/traces/&#123;traceId&#125;/logs</code>
          </div>
        </div>
        <footer>
          <p>Built {new Date().toISOString().slice(0, 10)}</p>
        </footer>
      </main>
    </div>
  )
}

export default App
