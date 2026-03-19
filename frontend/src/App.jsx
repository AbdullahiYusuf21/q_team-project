import { useState } from 'react'
import CircuitBuilder from './components/CircuitBuilder'
import AlgorithmPanel from './components/AlgorithmPanel'
import BlochSphere    from './components/BlochSphere'
import Tutorials      from './components/Tutorials'
import './index.css'

// The four tabs your user stories map to
const TABS = [
  { id: 'playground',   label: '⚛ Playground'   },
  { id: 'algorithms',   label: '📊 Algorithms'   },
  { id: 'entanglement', label: '🔮 Entanglement'  },
  { id: 'learn',        label: '📖 Learn'         },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('playground')

  return (
    <div style={styles.app}>

      {/* ── Header ───────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>Q</span>SIM
        </div>
        <p style={styles.tagline}>Quantum Circuit Simulator & Visualizer</p>
      </header>

      {/* ── Navigation ───────────────────────────────── */}
      <nav style={styles.nav}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.navBtn,
              ...(activeTab === tab.id ? styles.navBtnActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Page Content ─────────────────────────────── */}
      <main style={styles.main}>
        {activeTab === 'playground'   && <CircuitBuilder />}
        {activeTab === 'algorithms'   && <AlgorithmPanel />}
        {activeTab === 'entanglement' && <BlochSphere />}
        {activeTab === 'learn'        && <Tutorials />}
      </main>

    </div>
  )
}

// Inline styles using our CSS variables
// We use inline styles here so you can see exactly what styles
// each element has without hunting through a separate CSS file.
const styles = {
  app: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '24px 40px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: 'var(--text-primary)',
  },
  logoAccent: {
    color: 'var(--accent)',
  },
  tagline: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    padding: '12px 40px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  navBtn: {
    padding: '8px 20px',
    borderRadius: '8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
  },
  navBtnActive: {
    background: 'var(--accent-glow)',
    border: '1px solid var(--accent)',
    color: 'var(--text-primary)',
  },
  main: {
    flex: 1,
    padding: '32px 40px',
  },
}