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
function QuantumBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
    }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial glow gradient */}
          <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#7c6aff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c6aff" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#30d158" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#30d158" stopOpacity="0"   />
          </radialGradient>
          <radialGradient id="glow3" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#bf5af2" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#bf5af2" stopOpacity="0"   />
          </radialGradient>
        </defs>

        {/* ── Large ambient glow orbs ── */}
        <ellipse cx="200"  cy="150" rx="300" ry="300"
          fill="url(#glow1)">
          <animate attributeName="rx" values="300;340;300"
            dur="8s" repeatCount="indefinite" />
          <animate attributeName="ry" values="300;260;300"
            dur="8s" repeatCount="indefinite" />
        </ellipse>

        <ellipse cx="1300" cy="700" rx="350" ry="350"
          fill="url(#glow2)">
          <animate attributeName="rx" values="350;300;350"
            dur="10s" repeatCount="indefinite" />
          <animate attributeName="ry" values="350;400;350"
            dur="10s" repeatCount="indefinite" />
        </ellipse>

        <ellipse cx="900" cy="200" rx="250" ry="250"
          fill="url(#glow3)">
          <animate attributeName="rx" values="250;280;250"
            dur="12s" repeatCount="indefinite" />
        </ellipse>

        {/* ── Probability wave — sine curves ── */}
        <path
          d="M0 450 Q180 400 360 450 Q540 500 720 450 Q900 400 1080 450 Q1260 500 1440 450"
          fill="none"
          stroke="#7c6aff"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        >
          <animate attributeName="d"
            values="
              M0 450 Q180 400 360 450 Q540 500 720 450 Q900 400 1080 450 Q1260 500 1440 450;
              M0 450 Q180 500 360 450 Q540 400 720 450 Q900 500 1080 450 Q1260 400 1440 450;
              M0 450 Q180 400 360 450 Q540 500 720 450 Q900 400 1080 450 Q1260 500 1440 450
            "
            dur="6s"
            repeatCount="indefinite"
          />
        </path>

        <path
          d="M0 300 Q180 250 360 300 Q540 350 720 300 Q900 250 1080 300 Q1260 350 1440 300"
          fill="none"
          stroke="#30d158"
          strokeWidth="0.6"
          strokeOpacity="0.25"
        >
          <animate attributeName="d"
            values="
              M0 300 Q180 250 360 300 Q540 350 720 300 Q900 250 1080 300 Q1260 350 1440 300;
              M0 300 Q180 350 360 300 Q540 250 720 300 Q900 350 1080 300 Q1260 250 1440 300;
              M0 300 Q180 250 360 300 Q540 350 720 300 Q900 250 1080 300 Q1260 350 1440 300
            "
            dur="9s"
            repeatCount="indefinite"
          />
        </path>

        <path
          d="M0 650 Q180 600 360 650 Q540 700 720 650 Q900 600 1080 650 Q1260 700 1440 650"
          fill="none"
          stroke="#bf5af2"
          strokeWidth="0.6"
          strokeOpacity="0.2"
        >
          <animate attributeName="d"
            values="
              M0 650 Q180 600 360 650 Q540 700 720 650 Q900 600 1080 650 Q1260 700 1440 650;
              M0 650 Q180 700 360 650 Q540 600 720 650 Q900 700 1080 650 Q1260 600 1440 650;
              M0 650 Q180 600 360 650 Q540 700 720 650 Q900 600 1080 650 Q1260 700 1440 650
            "
            dur="7s"
            repeatCount="indefinite"
          />
        </path>

        {/* ── Entanglement circles — pairs of orbiting rings ── */}
        <g transform="translate(120, 750)">
          <circle r="40" fill="none"
            stroke="#7c6aff" strokeWidth="0.8" strokeOpacity="0.5">
            <animate attributeName="r"
              values="40;48;40" dur="4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity"
              values="0.25;0.1;0.25" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="24" fill="none"
            stroke="#7c6aff" strokeWidth="0.5" strokeOpacity="0.3">
            <animate attributeName="r"
              values="24;18;24" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#7c6aff" fillOpacity="0.7">
            <animateTransform attributeName="transform"
              type="rotate" from="0 0 0" to="360 0 0"
              dur="4s" repeatCount="indefinite" />
            <animateMotion
              path="M 32 0 A 32 32 0 1 1 31.9 -0.5"
              dur="4s" repeatCount="indefinite" />
          </circle>
        </g>

        <g transform="translate(1320, 120)">
          <circle r="50" fill="none"
            stroke="#30d158" strokeWidth="0.8" strokeOpacity="0.4">
            <animate attributeName="r"
              values="50;58;50" dur="5s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity"
              values="0.2;0.08;0.2" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle r="30" fill="none"
            stroke="#30d158" strokeWidth="0.5" strokeOpacity="0.12">
            <animate attributeName="r"
              values="30;24;30" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#30d158" fillOpacity="0.5">
            <animateMotion
              path="M 40 0 A 40 40 0 1 1 39.9 -0.5"
              dur="5s" repeatCount="indefinite" />
          </circle>
        </g>

        <g transform="translate(700, 820)">
          <circle r="35" fill="none"
            stroke="#bf5af2" strokeWidth="0.8" strokeOpacity="0.2">
            <animate attributeName="r"
              values="35;42;35" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#bf5af2" fillOpacity="0.4">
            <animateMotion
              path="M 28 0 A 28 28 0 1 1 27.9 -0.5"
              dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ── Circuit trace lines ── */}
        <line x1="0" y1="180" x2="400" y2="180"
          stroke="#7c6aff" strokeWidth="0.5" strokeOpacity="0.18" />
        <line x1="400" y1="180" x2="400" y2="520"
          stroke="#7c6aff" strokeWidth="0.5" strokeOpacity="0.18" />
        <line x1="400" y1="520" x2="1440" y2="520"
          stroke="#7c6aff" strokeWidth="0.5" strokeOpacity="0.18" />

        <line x1="1440" y1="350" x2="900" y2="350"
          stroke="#30d158" strokeWidth="0.5" strokeOpacity="0.14" />
        <line x1="900" y1="350" x2="900" y2="700"
          stroke="#30d158" strokeWidth="0.5" strokeOpacity="0.14" />
        <line x1="900" y1="700" x2="0" y2="700"
          stroke="#30d158" strokeWidth="0.5" strokeOpacity="0.14" />

        {/* ── Circuit nodes — dots at trace intersections ── */}
        {[
          [400, 180], [400, 520], [900, 350], [900, 700]
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3"
            fill="none" stroke="#7c6aff"
            strokeWidth="1" strokeOpacity="0.18">
            <animate attributeName="r"
              values="3;5;3" dur={`${3 + i}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-opacity"
              values="0.6;0.2;0.6" dur={`${3 + i}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* ── Floating particles ── */}
        {[
          [150, 400, "#7c6aff", "7s"],
          [400, 200, "#30d158", "9s"],
          [750, 600, "#7c6aff", "11s"],
          [1100, 300, "#bf5af2", "8s"],
          [1300, 500, "#30d158", "10s"],
          [600, 100, "#ff9f0a", "13s"],
          [1000, 750, "#7c6aff", "6s"],
        ].map(([cx, cy, color, dur], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.5"
            fill={color} fillOpacity="0.6">
            <animate attributeName="cy"
              values={`${cy};${cy - 20};${cy}`}
              dur={dur} repeatCount="indefinite" />
            <animate attributeName="fill-opacity"
              values="0.6;0.2;0.6"
              dur={dur} repeatCount="indefinite" />
          </circle>
        ))}
        {/* ── Floating triangles ── */}
        {/* Each triangle is an SVG polygon with slow rotation and fade animation */}

        {/* Large outline triangle — top left region */}
        <polygon
          points="80,60 140,160 20,160"
          fill="none"
          stroke="#7c6aff"
          strokeWidth="0.8"
          strokeOpacity="0.25"
        >
          <animate attributeName="stroke-opacity"
            values="0.25;0.08;0.25" dur="7s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 80 110" to="360 80 110"
            dur="30s" repeatCount="indefinite" />
        </polygon>

        {/* Small filled triangle — top left */}
        <polygon
          points="60,20 75,45 45,45"
          fill="#7c6aff"
          fillOpacity="0.15"
        >
          <animate attributeName="fill-opacity"
            values="0.15;0.04;0.15" dur="5s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 60 32" to="-360 60 32"
            dur="20s" repeatCount="indefinite" />
        </polygon>

        {/* Large outline triangle — top right */}
        <polygon
          points="1380,40 1440,150 1320,150"
          fill="none"
          stroke="#30d158"
          strokeWidth="0.8"
          strokeOpacity="0.2"
        >
          <animate attributeName="stroke-opacity"
            values="0.2;0.06;0.2" dur="9s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 1380 95" to="360 1380 95"
            dur="25s" repeatCount="indefinite" />
        </polygon>

        {/* Small filled triangle — top right */}
        <polygon
          points="1420,200 1440,235 1400,235"
          fill="#30d158"
          fillOpacity="0.12"
        >
          <animate attributeName="fill-opacity"
            values="0.12;0.04;0.12" dur="6s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 1420 217" to="-360 1420 217"
            dur="18s" repeatCount="indefinite" />
        </polygon>

        {/* Medium outline triangle — bottom left */}
        <polygon
          points="50,780 120,900 -20,900"
          fill="none"
          stroke="#bf5af2"
          strokeWidth="0.8"
          strokeOpacity="0.2"
        >
          <animate attributeName="stroke-opacity"
            values="0.2;0.06;0.2" dur="8s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 50 840" to="360 50 840"
            dur="22s" repeatCount="indefinite" />
        </polygon>

        {/* Small filled triangle — bottom left */}
        <polygon
          points="180,820 205,865 155,865"
          fill="#bf5af2"
          fillOpacity="0.12"
        >
          <animate attributeName="fill-opacity"
            values="0.12;0.04;0.12" dur="7s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 180 842" to="-360 180 842"
            dur="16s" repeatCount="indefinite" />
        </polygon>

        {/* Large outline triangle — bottom right */}
        <polygon
          points="1350,750 1440,900 1260,900"
          fill="none"
          stroke="#7c6aff"
          strokeWidth="0.8"
          strokeOpacity="0.2"
        >
          <animate attributeName="stroke-opacity"
            values="0.2;0.06;0.2" dur="10s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 1350 825" to="360 1350 825"
            dur="28s" repeatCount="indefinite" />
        </polygon>

        {/* Small filled triangle — bottom right */}
        <polygon
          points="1200,800 1225,845 1175,845"
          fill="#ff9f0a"
          fillOpacity="0.15"
        >
          <animate attributeName="fill-opacity"
            values="0.15;0.04;0.15" dur="6s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 1200 822" to="-360 1200 822"
            dur="14s" repeatCount="indefinite" />
        </polygon>

        {/* Mid-screen scattered triangles */}
        <polygon
          points="550,50 575,95 525,95"
          fill="none"
          stroke="#ff9f0a"
          strokeWidth="0.6"
          strokeOpacity="0.18"
        >
          <animate attributeName="stroke-opacity"
            values="0.18;0.05;0.18" dur="8s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 550 72" to="360 550 72"
            dur="24s" repeatCount="indefinite" />
        </polygon>

        <polygon
          points="850,820 870,858 830,858"
          fill="none"
          stroke="#30d158"
          strokeWidth="0.6"
          strokeOpacity="0.18"
        >
          <animate attributeName="stroke-opacity"
            values="0.18;0.05;0.18" dur="11s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 850 839" to="-360 850 839"
            dur="19s" repeatCount="indefinite" />
        </polygon>

        <polygon
          points="1100,480 1125,525 1075,525"
          fill="none"
          stroke="#bf5af2"
          strokeWidth="0.6"
          strokeOpacity="0.15"
        >
          <animate attributeName="stroke-opacity"
            values="0.15;0.04;0.15" dur="9s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 1100 502" to="360 1100 502"
            dur="21s" repeatCount="indefinite" />
        </polygon>

        <polygon
          points="300,500 320,538 280,538"
          fill="#7c6aff"
          fillOpacity="0.1"
        >
          <animate attributeName="fill-opacity"
            values="0.1;0.03;0.1" dur="10s" repeatCount="indefinite" />
          <animateTransform attributeName="transform"
            type="rotate" from="0 300 519" to="-360 300 519"
            dur="17s" repeatCount="indefinite" />
        </polygon>
      </svg>
    </div>
  )
}
export default function App() {
  const [activeTab, setActiveTab] = useState('playground')
  const [theme,     setTheme]     = useState('dark')

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <div data-theme={theme} style={styles.app}>

      {/* Quantum animated background */}
      <QuantumBackground /> 

      {/*All content sits above the background */}
      <div style={{ position: 'relative',zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>

        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>
            <span style={styles.logoQ}>Q</span>
            <span style={styles.logoSim}>SIM</span>
            <div style={styles.logoBadge}>BETA</div>
          </div>
          <div style={styles.headerDivider} />
          <p style={styles.tagline}>Quantum Circuit Simulator & Visualizer</p>
        </div>
        <div style={styles.headerRight}>
          {/* Live indicator */}
          <div style={styles.liveIndicator}>
            <div style={styles.liveDot} />
            <span style={styles.liveText}>Engine Live</span>
          </div>
          <button onClick={toggleTheme} style={styles.themeBtn}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
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
    WebkitBackdropFilter: 'blur(20px)',
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
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
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
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
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
  headerRight: {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
},
logoQ: {
  color: 'var(--accent)',
  fontFamily: 'var(--font-mono)',
  fontSize: '24px',
  fontWeight: '800',
},
logoSim: {
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '24px',
  fontWeight: '300',
  letterSpacing: '0.15em',
},
logoBadge: {
  fontSize: '8px',
  fontFamily: 'var(--font-mono)',
  fontWeight: '700',
  color: 'var(--accent)',
  border: '1px solid var(--accent)',
  borderRadius: '4px',
  padding: '1px 4px',
  letterSpacing: '0.1em',
  alignSelf: 'flex-start',
  marginTop: '2px',
},
headerDivider: {
  width: '1px',
  height: '20px',
  background: 'var(--border-hover)',
},
liveIndicator: {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: '20px',
  border: '1px solid rgba(48, 209, 88, 0.3)',
  background: 'rgba(48, 209, 88, 0.08)',
},
liveDot: {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#30d158',
  animation: 'pulse 2s ease infinite',
},
liveText: {
  fontSize: '11px',
  color: '#30d158',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
},
themeBtn: {
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  border: '1px solid var(--border-hover)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
},
}