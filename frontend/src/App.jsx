import { useState } from 'react'
import CircuitBuilder from './components/CircuitBuilder'
import AlgorithmPanel from './components/AlgorithmPanel'
import BlochSphere    from './components/BlochSphere'
import Tutorials      from './components/Tutorials'
import './index.css'

const TABS = [
  { id: 'playground',   label: ' Playground'  },
  { id: 'algorithms',   label: ' Algorithms'  },
  { id: 'entanglement', label: ' Entanglement' },
  { id: 'learn',        label: ' Learning Tutorials'        },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('playground')
  const [theme,     setTheme]     = useState('dark')

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <div data-theme={theme} style={styles.app}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={{ color: 'var(--accent)' }}>Q</span>LEARN
          </div>
          <p style={styles.tagline}>Quantum Simulator and Visualiser</p>
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme} style={styles.themeBtn}>
          {theme === 'dark' ? '☀️  Light' : '🌙  Dark'}
        </button>
      </header>

      {/* ── Navigation ── */}
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

      {/* ── Content ── */}
      <main style={styles.main}>
        {activeTab === 'playground'   && <CircuitBuilder />}
        {activeTab === 'algorithms'   && <AlgorithmPanel />}
        {activeTab === 'entanglement' && <BlochSphere />}
        {activeTab === 'learn'        && <Tutorials />}
      </main>

    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background 0.3s ease',
  },
  header: {
    padding: '20px 40px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-secondary)',
    backdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    color: 'var(--text-primary)',
  },
  tagline: {
    fontFamily: 'var(--font-text)',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    letterSpacing: '0.02em',
  },
  themeBtn: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border-hover)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-text)',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    letterSpacing: '0.02em',
  },
  nav: {
    display: 'flex',
    gap: '2px',
    padding: '10px 40px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  navBtn: {
    padding: '7px 18px',
    borderRadius: '8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    letterSpacing: '0.01em',
  },
  navBtnActive: {
    background: 'var(--accent-glow)',
    border: '1px solid var(--accent)',
    color: 'var(--text-primary)',
  },
  main: {
    flex: 1,
    padding: '36px 40px',
  },
}