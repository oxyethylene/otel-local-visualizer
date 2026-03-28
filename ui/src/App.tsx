import { useState } from 'react'
import { LogsPanel } from './components/LogsPanel'
import { MetricsPanel } from './components/MetricsPanel'
import { TracePanel } from './components/TracePanel'

type TabKey = 'traces' | 'logs' | 'metrics'

const tabs: Array<{ key: TabKey; label: string; description: string }> = [
  {
    key: 'traces',
    label: 'Traces',
    description: 'Browse spans by trace id',
  },
  {
    key: 'logs',
    label: 'Logs',
    description: 'Inspect trace-linked log records',
  },
  {
    key: 'metrics',
    label: 'Metrics',
    description: 'Explore metric names and points',
  },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('traces')

  return (
    <div className="app">
      <header>
        <h1>OTel Collector Local Visualizer</h1>
        <p className="subtitle">OpenTelemetry Collector in-memory telemetry explorer</p>
      </header>
      <main>
        <nav className="tab-bar" aria-label="Telemetry sections">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-label">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </button>
          ))}
        </nav>

        <section className="panel-container" aria-live="polite">
          {activeTab === 'traces' && <TracePanel />}
          {activeTab === 'logs' && <LogsPanel />}
          {activeTab === 'metrics' && <MetricsPanel />}
        </section>

        <footer>
          <p>Built {new Date().toISOString().slice(0, 10)}</p>
        </footer>
      </main>
    </div>
  )
}

export default App
