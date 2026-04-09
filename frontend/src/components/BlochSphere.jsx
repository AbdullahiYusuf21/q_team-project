import { useState } from 'react'
import { getBlochState } from '../api'

const GATES = [
  { id: 'H', label: 'H', color: '#7c6aff', desc: 'Hadamard — superposition' },
  { id: 'X', label: 'X', color: '#ff453a', desc: 'Pauli-X — bit flip' },
  { id: 'Y', label: 'Y', color: '#ff9f0a', desc: 'Pauli-Y — bit + phase flip' },
  { id: 'Z', label: 'Z', color: '#ffd60a', desc: 'Pauli-Z — phase flip' },
  { id: 'S', label: 'S', color: '#bf5af2', desc: 'S Gate — 90° phase' },
  { id: 'T', label: 'T', color: '#ff375f', desc: 'T Gate — 45° phase' },
]

// Projects 3D Bloch coordinates onto 2D SVG
// Uses a simple isometric-style projection
// x3d, y3d, z3d are Bloch sphere coordinates
// Returns {x, y} SVG coordinates
function project(x3d, y3d, z3d, cx, cy, r) {
  // Rotate slightly for 3D feel
  const angle = Math.PI / 6  // 30 degrees
  const cosA  = Math.cos(angle)
  const sinA  = Math.sin(angle)

  // Apply y-axis rotation for isometric view
  const rx = x3d * cosA - y3d * sinA
  const rz = z3d

  return {
    x: cx + rx * r,
    y: cy - rz * r,
  }
}

function BlochSVG({ blochX, blochY, blochZ }) {
  const cx = 200  // centre x
  const cy = 200  // centre y
  const r  = 140  // sphere radius

  // Project key points
  const north  = project(0,  0,  1, cx, cy, r)
  const south  = project(0,  0, -1, cx, cy, r)
  const front  = project(1,  0,  0, cx, cy, r)
  const back   = project(-1, 0,  0, cx, cy, r)
  const right  = project(0,  1,  0, cx, cy, r)
  const left   = project(0, -1,  0, cx, cy, r)

  // State vector tip
  const tip    = project(blochX, blochY, blochZ, cx, cy, r)

  // Generate equator ellipse points
  const equatorPoints = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2
    return project(Math.cos(a), Math.sin(a), 0, cx, cy, r)
  })
  const equatorPath = equatorPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ') + ' Z'

  // Generate meridian (vertical circle) points
  const meridianPoints = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2
    return project(Math.cos(a), 0, Math.sin(a), cx, cy, r)
  })
  const meridianPath = meridianPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ') + ' Z'

  return (
    <svg width="400" height="400" viewBox="0 0 400 400">

      {/* ── Outer sphere circle ── */}
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke="#7c6aff" strokeWidth="0.8" strokeOpacity="0.15" />

      {/* ── Sphere shading ── */}
      <circle cx={cx} cy={cy} r={r}
        fill="radial-gradient"
        style={{ fill: 'url(#sphereGrad)' }} />

      <defs>
        <radialGradient id="sphereGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#7c6aff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#7c6aff" stopOpacity="0.02" />
        </radialGradient>
      </defs>

      {/* ── Equator ellipse ── */}
      <path d={equatorPath}
        fill="none" stroke="#7c6aff"
        strokeWidth="0.8" strokeOpacity="0.25"
        strokeDasharray="4,4" />

      {/* ── Meridian circle ── */}
      <path d={meridianPath}
        fill="none" stroke="#7c6aff"
        strokeWidth="0.8" strokeOpacity="0.15"
        strokeDasharray="4,4" />

      {/* ── Z axis (vertical) ── */}
      <line x1={north.x} y1={north.y} x2={south.x} y2={south.y}
        stroke="#7c6aff" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* ── X axis ── */}
      <line x1={front.x} y1={front.y} x2={back.x} y2={back.y}
        stroke="#ff453a" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* ── Y axis ── */}
      <line x1={right.x} y1={right.y} x2={left.x} y2={left.y}
        stroke="#30d158" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* ── Pole labels ── */}
      <text x={north.x} y={north.y - 10}
        textAnchor="middle" fontSize="11"
        fill="#7c6aff" fontFamily="var(--font-mono)" fontWeight="600">
        |0⟩
      </text>
      <text x={south.x} y={south.y + 18}
        textAnchor="middle" fontSize="11"
        fill="#7c6aff" fontFamily="var(--font-mono)" fontWeight="600">
        |1⟩
      </text>
      <text x={front.x + 10} y={front.y + 4}
        textAnchor="start" fontSize="10"
        fill="#ff453a" fontFamily="var(--font-mono)" opacity="0.7">
        |+⟩
      </text>
      <text x={back.x - 10} y={back.y + 4}
        textAnchor="end" fontSize="10"
        fill="#ff453a" fontFamily="var(--font-mono)" opacity="0.7">
        |−⟩
      </text>

      {/* ── Pole dots ── */}
      <circle cx={north.x} cy={north.y} r="4"
        fill="#7c6aff" opacity="0.6" />
      <circle cx={south.x} cy={south.y} r="4"
        fill="#7c6aff" opacity="0.6" />
      <circle cx={front.x} cy={front.y} r="3"
        fill="#ff453a" opacity="0.5" />
      <circle cx={back.x}  cy={back.y}  r="3"
        fill="#ff453a" opacity="0.5" />

      {/* ── State vector — line from centre to tip ── */}
      <line
        x1={cx} y1={cy}
        x2={tip.x} y2={tip.y}
        stroke="#7c6aff" strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ── State vector tip glow ── */}
      <circle cx={tip.x} cy={tip.y} r="8"
        fill="#7c6aff" opacity="0.15" />
      <circle cx={tip.x} cy={tip.y} r="5"
        fill="#7c6aff" opacity="0.4" />
      <circle cx={tip.x} cy={tip.y} r="3"
        fill="#ffffff" opacity="0.9" />

      {/* ── Centre dot ── */}
      <circle cx={cx} cy={cy} r="3"
        fill="#7c6aff" opacity="0.5" />

      {/* ── Dashed projection lines ── */}
      {/* Vertical drop from tip to equator */}
      <line
        x1={tip.x} y1={tip.y}
        x2={tip.x} y2={cy}
        stroke="#7c6aff" strokeWidth="0.6"
        strokeOpacity="0.3" strokeDasharray="3,3" />
      {/* Horizontal from equator point to centre */}
      <line
        x1={cx} y1={cy}
        x2={tip.x} y2={cy}
        stroke="#7c6aff" strokeWidth="0.6"
        strokeOpacity="0.3" strokeDasharray="3,3" />

    </svg>
  )
}

export default function BlochSphere() {
  const [gates,         setGates]         = useState([])
  const [bloch,         setBloch]         = useState({ x: 0, y: 0, z: 1 })
  const [stateLabel,    setStateLabel]    = useState('|0⟩')
  const [probabilities, setProbabilities] = useState({ '0': 1, '1': 0 })
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)

  async function handleApplyGate(gateId) {
    const newGates = [...gates, { gate: gateId, target: 0 }]
    setLoading(true)
    setError(null)

    try {
      const data = await getBlochState(newGates)
      setGates(newGates)
      setBloch({ x: data.x, y: data.y, z: data.z })
      setStateLabel(data.label)
      setProbabilities(data.probabilities)
    } catch (err) {
      setError('Backend error — make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setGates([])
    setBloch({ x: 0, y: 0, z: 1 })
    setStateLabel('|0⟩')
    setProbabilities({ '0': 1, '1': 0 })
    setError(null)
  }

  return (
    <div style={styles.container}>

      <div style={styles.titleRow}>
        <h2 style={styles.title}>Bloch Sphere</h2>
        <p style={styles.subtitle}>
          Visualize single-qubit states geometrically.
          Every point on the sphere surface is a valid qubit state.
        </p>
      </div>

      <div style={styles.layout}>

        {/* ── Left — controls ── */}
        <div style={styles.leftPanel}>

          {/* Current state */}
          <div style={styles.stateCard}>
            <div style={styles.stateCardLabel}>Current State</div>
            <div style={styles.stateSymbol}>{stateLabel}</div>
            <div style={styles.stateCoords}>
              <span style={styles.coord}>
                <span style={styles.coordLabel}>x </span>
                {bloch.x.toFixed(3)}
              </span>
              <span style={styles.coord}>
                <span style={styles.coordLabel}>y </span>
                {bloch.y.toFixed(3)}
              </span>
              <span style={styles.coord}>
                <span style={styles.coordLabel}>z </span>
                {bloch.z.toFixed(3)}
              </span>
            </div>
            <div style={styles.probRow}>
              <div style={styles.probItem}>
                <span style={styles.probLabel}>P(|0⟩)</span>
                <span style={styles.probValue}>
                  {((probabilities['0'] || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div style={styles.probItem}>
                <span style={styles.probLabel}>P(|1⟩)</span>
                <span style={styles.probValue}>
                  {((probabilities['1'] || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Gate buttons */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Apply Gate</div>
            <div style={styles.gateGrid}>
              {GATES.map(gate => (
                <div key={gate.id} className="tooltip-wrapper">
                  <button
                    onClick={() => handleApplyGate(gate.id)}
                    disabled={loading}
                    style={{
                      ...styles.gateBtn,
                      borderColor: gate.color,
                      color: gate.color,
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    {gate.label}
                  </button>
                  <div className="tooltip">
                    <div className="tooltip-title">{gate.label} Gate</div>
                    <div className="tooltip-desc">{gate.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gate sequence */}
          {gates.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Applied Sequence</div>
              <div style={styles.sequence}>
                <span style={styles.sequenceStart}>|0⟩</span>
                {gates.map((g, i) => {
                  const gateDef = GATES.find(x => x.id === g.gate)
                  return (
                    <span key={i} style={{
                      ...styles.sequenceGate,
                      color: gateDef?.color || 'var(--text-primary)',
                      borderColor: gateDef?.color || 'var(--border)',
                    }}>
                      {g.gate}
                    </span>
                  )
                })}
                <span style={styles.sequenceEnd}>{stateLabel}</span>
              </div>
            </div>
          )}

          <button onClick={handleReset} style={styles.resetBtn}>
            ↺ Reset to |0⟩
          </button>

          {error && <div style={styles.error}>{error}</div>}

          {/* Entanglement note */}
          <div style={styles.noteCard}>
            <div style={styles.noteTitle}>⚠ Note on Entanglement</div>
            <div style={styles.noteText}>
              The Bloch sphere represents only single qubit states.
              Entangled qubits cannot be described by individual Bloch
              spheres — their states are fundamentally inseparable.
              This is what makes entanglement non-classical.
            </div>
          </div>

          {/* Axis legend */}
          <div style={styles.legendCard}>
            <div style={styles.sectionLabel}>Axis Guide</div>
            {[
              { color: '#7c6aff', text: 'Z axis — |0⟩ top, |1⟩ bottom' },
              { color: '#ff453a', text: 'X axis — |+⟩ to |−⟩' },
              { color: '#30d158', text: 'Y axis — |i⟩ to |−i⟩' },
            ].map((item, i) => (
              <div key={i} style={styles.legendRow}>
                <span style={{ ...styles.legendDot, background: item.color }} />
                <span style={styles.legendText}>{item.text}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ── Right — SVG sphere ── */}
        <div style={styles.rightPanel}>
          <div style={styles.sphereCard}>
            <BlochSVG
              blochX={bloch.x}
              blochY={bloch.y}
              blochZ={bloch.z}
            />
          </div>

          {/* Try these sequences */}
          <div style={styles.educationCard}>
            <div style={styles.sectionLabel}>Try These Sequences</div>
            {[
              {
                label: 'Superposition',
                sequence: 'H',
                result: '|+⟩ on equator',
                desc: 'H moves from north pole to equator — 50/50 probability.'
              },
              {
                label: 'Full Flip',
                sequence: 'X',
                result: '|1⟩ south pole',
                desc: 'X rotates 180° around X axis — north to south pole.'
              },
              {
                label: 'Phase then Interference',
                sequence: 'H → Z → H',
                result: '|1⟩',
                desc: 'Z is invisible alone but causes destructive interference after H.'
              },
              {
                label: 'H is its own inverse',
                sequence: 'H → H',
                result: '|0⟩',
                desc: 'Two Hadamards cancel perfectly — returns to north pole.'
              },
            ].map((ex, i) => (
              <div key={i} style={styles.exampleRow}>
                <div style={styles.exampleLabel}>{ex.label}</div>
                <div style={styles.exampleSequence}>{ex.sequence}</div>
                <div style={styles.exampleResult}>→ {ex.result}</div>
                <div style={styles.exampleDesc}>{ex.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  container:      { maxWidth: '1100px' },
  titleRow:       { marginBottom: '28px' },
  title: {
    fontSize: '24px', fontWeight: '700',
    color: 'var(--text-primary)', marginBottom: '4px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-secondary)', fontSize: '13px',
    fontFamily: 'var(--font-mono)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftPanel:  { display: 'flex', flexDirection: 'column', gap: '16px' },
  rightPanel: { display: 'flex', flexDirection: 'column', gap: '16px' },
  stateCard: {
    background: 'var(--bg-card)', borderRadius: '14px',
    border: '1px solid var(--border)', padding: '20px', textAlign: 'center',
  },
  stateCardLabel: {
    fontSize: '10px', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: '8px',
  },
  stateSymbol: {
    fontSize: '36px', fontFamily: 'var(--font-mono)',
    fontWeight: '300', color: 'var(--accent)',
    marginBottom: '12px', letterSpacing: '-0.02em',
  },
  stateCoords: {
    display: 'flex', justifyContent: 'center',
    gap: '12px', marginBottom: '16px',
  },
  coord: {
    fontSize: '11px', fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  coordLabel: { color: 'var(--accent)', marginRight: '2px' },
  probRow: {
    display: 'flex', justifyContent: 'center', gap: '20px',
    paddingTop: '12px', borderTop: '1px solid var(--border)',
  },
  probItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  probLabel: { fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  probValue: { fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' },
  section:      { display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionLabel: {
    fontSize: '10px', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  gateGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  gateBtn: {
    width: '100%', height: '44px', borderRadius: '10px',
    border: '1px solid', background: 'transparent',
    cursor: 'pointer', fontSize: '14px',
    fontFamily: 'var(--font-mono)', fontWeight: '700',
    transition: 'all 0.15s ease',
  },
  sequence: {
    display: 'flex', alignItems: 'center', gap: '4px',
    flexWrap: 'wrap', padding: '10px 12px',
    background: 'var(--bg-card)', borderRadius: '10px',
    border: '1px solid var(--border)',
  },
  sequenceStart: { fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' },
  sequenceGate: {
    fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700',
    padding: '2px 6px', borderRadius: '4px', border: '1px solid', background: 'transparent',
  },
  sequenceEnd: { fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: '600' },
  resetBtn: {
    padding: '9px 16px', borderRadius: '10px',
    border: '1px solid var(--border-hover)', background: 'transparent',
    color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: '12px', fontFamily: 'var(--font-mono)',
    transition: 'all 0.15s ease', width: '100%',
  },
  error: {
    color: '#ff453a', fontSize: '12px', fontFamily: 'var(--font-mono)',
    padding: '10px 14px', background: 'rgba(255,69,58,0.08)',
    borderRadius: '10px', border: '1px solid rgba(255,69,58,0.2)',
  },
  noteCard: {
    background: 'rgba(255, 159, 10, 0.06)', borderRadius: '12px',
    border: '1px solid rgba(255, 159, 10, 0.2)', padding: '14px 16px',
  },
  noteTitle: {
    fontSize: '11px', color: '#ff9f0a', fontFamily: 'var(--font-mono)',
    fontWeight: '600', marginBottom: '6px', letterSpacing: '0.02em',
  },
  noteText: {
    fontSize: '11px', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)', lineHeight: '1.6',
  },
  legendCard: {
    background: 'var(--bg-card)', borderRadius: '12px',
    border: '1px solid var(--border)', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  legendRow:  { display: 'flex', alignItems: 'center', gap: '8px' },
  legendDot:  { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  legendText: { fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' },
  sphereCard: {
    background: 'var(--bg-card)', borderRadius: '14px',
    border: '1px solid var(--border)', padding: '20px',
    display: 'flex', justifyContent: 'center',
  },
  educationCard: {
    background: 'var(--bg-card)', borderRadius: '14px',
    border: '1px solid var(--border)', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  exampleRow: {
    paddingBottom: '14px', borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  exampleLabel:    { fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' },
  exampleSequence: { fontSize: '12px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' },
  exampleResult:   { fontSize: '11px', color: '#30d158', fontFamily: 'var(--font-mono)' },
  exampleDesc:     { fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: '1.5' },
}