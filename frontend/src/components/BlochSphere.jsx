import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getBlochState } from '../api'

// ─────────────────────────────────────────────────────
// BLOCH SPHERE — Three.js visualization of a single
// qubit state. The state vector is shown as an arrow
// from the centre of the sphere to its surface.
//
// Gate sequence builds up one gate at a time.
// Each gate application animates the arrow to its
// new position using linear interpolation (lerp).
// ─────────────────────────────────────────────────────

const GATES = [
  { id: 'H', label: 'H', color: '#7c6aff', desc: 'Hadamard — superposition' },
  { id: 'X', label: 'X', color: '#ff453a', desc: 'Pauli-X — bit flip'       },
  { id: 'Y', label: 'Y', color: '#ff9f0a', desc: 'Pauli-Y — bit + phase flip'},
  { id: 'Z', label: 'Z', color: '#ffd60a', desc: 'Pauli-Z — phase flip'     },
  { id: 'S', label: 'S', color: '#bf5af2', desc: 'S Gate — 90° phase'       },
  { id: 'T', label: 'T', color: '#ff375f', desc: 'T Gate — 45° phase'       },
]

// Known state labels and their Bloch coordinates
const STATE_LABELS = [
  { label: '|0⟩',  x:  0, y:  0, z:  1  },
  { label: '|1⟩',  x:  0, y:  0, z: -1  },
  { label: '|+⟩',  x:  1, y:  0, z:  0  },
  { label: '|−⟩',  x: -1, y:  0, z:  0  },
  { label: '|i⟩',  x:  0, y:  1, z:  0  },
  { label: '|-i⟩', x:  0, y: -1, z:  0  },
]

export default function BlochSphere() {
  const mountRef    = useRef(null)  // DOM node Three.js renders into
  const sceneRef    = useRef(null)  // Three.js scene
  const arrowRef    = useRef(null)  // The state vector arrow
  const rendererRef = useRef(null)
  const frameRef    = useRef(null)

  const [gates,       setGates]       = useState([])  // applied gate sequence
  const [stateInfo,   setStateInfo]   = useState({ label: '|0⟩', x: 0, y: 0, z: 1 })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [probabilities, setProbabilities] = useState({ '0': 1, '1': 0 })

  // ── Three.js setup ─────────────────────────────────
  useEffect(() => {
    const width  = mountRef.current.clientWidth
    const height = 400

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera — perspective, positioned slightly off-axis
    // so we can see the sphere in 3D
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(2.2, 1.4, 2.2)
    camera.lookAt(0, 0, 0)

    // Renderer with transparent background
    // so the quantum background shows through
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Sphere wireframe ───────────────────────────
    // We use a wireframe sphere so the background
    // and the state vector inside are both visible
    const sphereGeo  = new THREE.SphereGeometry(1, 24, 24)
    const sphereMat  = new THREE.MeshBasicMaterial({
      color: 0x7c6aff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    scene.add(new THREE.Mesh(sphereGeo, sphereMat))

    // Outer glow ring — equator circle
    const equatorGeo = new THREE.TorusGeometry(1, 0.003, 8, 64)
    const equatorMat = new THREE.MeshBasicMaterial({
      color: 0x7c6aff,
      transparent: true,
      opacity: 0.3,
    })
    scene.add(new THREE.Mesh(equatorGeo, equatorMat))

    // ── Axes ───────────────────────────────────────
    // X axis — red, Y axis — green, Z axis — blue
    // These are the Bloch sphere axes
    const axisLength = 1.3
    const axes = [
      { dir: new THREE.Vector3(1,0,0),  color: 0xff453a, label: 'X' },
      { dir: new THREE.Vector3(0,1,0),  color: 0x30d158, label: 'Y' },
      { dir: new THREE.Vector3(0,0,1),  color: 0x7c6aff, label: 'Z' },
    ]

    axes.forEach(({ dir, color }) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 })
      const points = [
        dir.clone().multiplyScalar(-axisLength),
        dir.clone().multiplyScalar(axisLength)
      ]
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        mat
      ))
    })

    // ── Pole markers ───────────────────────────────
    const poleMat = new THREE.MeshBasicMaterial({ color: 0xf0f0ff })
    const poleSphere = new THREE.SphereGeometry(0.04, 8, 8)
    ;[
      new THREE.Vector3(0,  0,  1.1),   // |0⟩ north
      new THREE.Vector3(0,  0, -1.1),   // |1⟩ south
      new THREE.Vector3( 1.1, 0, 0),    // |+⟩
      new THREE.Vector3(-1.1, 0, 0),    // |−⟩
    ].forEach(pos => {
      const dot = new THREE.Mesh(poleSphere, poleMat)
      dot.position.copy(pos)
      scene.add(dot)
    })

    // ── State vector arrow ─────────────────────────
    // ArrowHelper draws an arrow from origin to a point
    // The arrow represents the current qubit state
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),  // initial direction |0⟩ = north pole
      new THREE.Vector3(0, 0, 0),  // origin
      1.0,                          // length
      0x7c6aff,                     // colour
      0.15,                         // head length
      0.08                          // head width
    )
    scene.add(arrow)
    arrowRef.current = arrow

    // ── Lighting ───────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0x7c6aff, 0.4)
    dirLight.position.set(2, 2, 2)
    scene.add(dirLight)

    // ── Slow auto-rotation ─────────────────────────
    // The sphere rotates slowly on its Y axis so the
    // user can see the state vector in 3D without
    // needing to drag/orbit
    let angle = 0
    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      angle += 0.003
      scene.rotation.y = angle
      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup on unmount ─────────────────────────
    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  // ── Update arrow when state changes ───────────────
  // Called after every gate application.
  // Smoothly moves the arrow to the new Bloch position.
  function updateArrow(x, y, z) {
    if (!arrowRef.current) return

    // Three.js Y axis is up, but Bloch sphere Z is up.
    // We map Bloch (x,y,z) to Three.js (x,z,y)
    // so |0⟩ appears at the top of the sphere.
    const dir = new THREE.Vector3(x, z, y).normalize()
    arrowRef.current.setDirection(dir)
    arrowRef.current.setColor(new THREE.Color(0x7c6aff))
  }

  // ── Apply gate ─────────────────────────────────────
  async function handleApplyGate(gateId) {
    const newGates = [...gates, { gate: gateId, target: 0 }]
    setLoading(true)
    setError(null)

    try {
      const data = await getBlochState(newGates)
      setGates(newGates)
      setStateInfo({ label: data.label, x: data.x, y: data.y, z: data.z })
      setProbabilities(data.probabilities)
      updateArrow(data.x, data.y, data.z)
    } catch (err) {
      setError('Backend error — make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  // ── Reset ──────────────────────────────────────────
  function handleReset() {
    setGates([])
    setStateInfo({ label: '|0⟩', x: 0, y: 0, z: 1 })
    setProbabilities({ '0': 1, '1': 0 })
    updateArrow(0, 0, 1)
    setError(null)
  }

  return (
    <div style={styles.container}>

      {/* ── Title ── */}
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Bloch Sphere</h2>
        <p style={styles.subtitle}>
          Visualize single-qubit states geometrically.
          Every point on the sphere is a valid qubit state.
        </p>
      </div>

      <div style={styles.layout}>

        {/* ── Left panel — controls ── */}
        <div style={styles.leftPanel}>

          {/* Current state display */}
          <div style={styles.stateCard}>
            <div style={styles.stateCardLabel}>Current State</div>
            <div style={styles.stateSymbol}>{stateInfo.label}</div>
            <div style={styles.stateCoords}>
              <span style={styles.coord}>
                <span style={styles.coordLabel}>x</span>
                {stateInfo.x.toFixed(3)}
              </span>
              <span style={styles.coord}>
                <span style={styles.coordLabel}>y</span>
                {stateInfo.y.toFixed(3)}
              </span>
              <span style={styles.coord}>
                <span style={styles.coordLabel}>z</span>
                {stateInfo.z.toFixed(3)}
              </span>
            </div>
            {/* Measurement probabilities */}
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

          {/* Applied gate sequence */}
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
                <span style={styles.sequenceEnd}>{stateInfo.label}</span>
              </div>
            </div>
          )}

          {/* Reset button */}
          <button onClick={handleReset} style={styles.resetBtn}>
            ↺ Reset to |0⟩
          </button>

          {error && <div style={styles.error}>{error}</div>}

          {/* Entanglement note */}
          <div style={styles.noteCard}>
            <div style={styles.noteTitle}>⚠ Note on Entanglement</div>
            <div style={styles.noteText}>
              The Bloch sphere represents only <em>single qubit</em> states.
              Entangled qubits cannot be described by individual Bloch spheres —
              their states are inseparable. This is what makes entanglement
              fundamentally non-classical.
            </div>
          </div>

          {/* Axis legend */}
          <div style={styles.legendCard}>
            <div style={styles.sectionLabel}>Axis Guide</div>
            <div style={styles.legendRow}>
              <span style={{...styles.legendDot, background: '#7c6aff'}} />
              <span style={styles.legendText}>Z axis — |0⟩ (top) to |1⟩ (bottom)</span>
            </div>
            <div style={styles.legendRow}>
              <span style={{...styles.legendDot, background: '#ff453a'}} />
              <span style={styles.legendText}>X axis — |+⟩ to |−⟩</span>
            </div>
            <div style={styles.legendRow}>
              <span style={{...styles.legendDot, background: '#30d158'}} />
              <span style={styles.legendText}>Y axis — |i⟩ to |−i⟩</span>
            </div>
          </div>

        </div>

        {/* ── Right panel — Three.js sphere ── */}
        <div style={styles.rightPanel}>
          <div style={styles.sphereCard}>

            {/* Axis labels overlay */}
            <div style={styles.axisLabels}>
              <span style={{...styles.axisLabel, top: '8px', left: '50%', transform: 'translateX(-50%)', color: '#7c6aff'}}>
                |0⟩ +Z
              </span>
              <span style={{...styles.axisLabel, bottom: '8px', left: '50%', transform: 'translateX(-50%)', color: '#7c6aff'}}>
                |1⟩ −Z
              </span>
              <span style={{...styles.axisLabel, top: '50%', right: '8px', transform: 'translateY(-50%)', color: '#ff453a'}}>
                |+⟩
              </span>
              <span style={{...styles.axisLabel, top: '50%', left: '8px', transform: 'translateY(-50%)', color: '#ff453a'}}>
                |−⟩
              </span>
            </div>

            {/* Three.js mounts here */}
            <div ref={mountRef} style={styles.mount} />

            {/* Loading overlay */}
            {loading && (
              <div style={styles.loadingOverlay}>
                <div style={styles.loadingDot} />
              </div>
            )}

          </div>

          {/* Educational walkthrough */}
          <div style={styles.educationCard}>
            <div style={styles.sectionLabel}>Try These Sequences</div>
            {[
              {
                label: 'Superposition',
                sequence: 'H',
                result: '|+⟩ on equator',
                desc: 'H moves the state from the north pole to the equator — equal probability of 0 and 1.'
              },
              {
                label: 'Full Flip',
                sequence: 'X',
                result: '|1⟩ south pole',
                desc: 'X rotates 180° around the X axis — flips from north to south pole.'
              },
              {
                label: 'Phase Flip',
                sequence: 'H → Z → H',
                result: '|1⟩',
                desc: 'Z is invisible alone but after H it causes destructive interference — ending at |1⟩.'
              },
              {
                label: 'Return Home',
                sequence: 'H → H',
                result: '|0⟩',
                desc: 'Two Hadamards cancel — H is its own inverse. Returns to north pole.'
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

// ── Styles ────────────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1100px',
  },
  titleRow: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stateCard: {
    background: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    padding: '20px',
    textAlign: 'center',
  },
  stateCardLabel: {
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
  },
  stateSymbol: {
    fontSize: '36px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '300',
    color: 'var(--accent)',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  stateCoords: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  coord: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  coordLabel: {
    color: 'var(--accent)',
    marginRight: '2px',
  },
  probRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
  },
  probItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  probLabel: {
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  },
  probValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionLabel: {
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  gateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  gateBtn: {
    width: '100%',
    height: '44px',
    borderRadius: '10px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    transition: 'all 0.15s ease',
  },
  sequence: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
    padding: '10px 12px',
    background: 'var(--bg-card)',
    borderRadius: '10px',
    border: '1px solid var(--border)',
  },
  sequenceStart: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  sequenceGate: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid',
    background: 'transparent',
  },
  sequenceEnd: {
    fontSize: '11px',
    color: 'var(--accent)',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
  },
  resetBtn: {
    padding: '9px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border-hover)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  error: {
    color: '#ff453a',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    padding: '10px 14px',
    background: 'rgba(255,69,58,0.08)',
    borderRadius: '10px',
    border: '1px solid rgba(255,69,58,0.2)',
  },
  noteCard: {
    background: 'rgba(255, 159, 10, 0.06)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 159, 10, 0.2)',
    padding: '14px 16px',
  },
  noteTitle: {
    fontSize: '11px',
    color: '#ff9f0a',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  },
  noteText: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
  },
  legendCard: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendText: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sphereCard: {
    background: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    position: 'relative',
  },
  axisLabels: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 2,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    opacity: 0.7,
  },
  mount: {
    width: '100%',
    height: '400px',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15,15,24,0.4)',
    zIndex: 3,
  },
  loadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'pulse 1s ease infinite',
  },
  educationCard: {
    background: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  exampleRow: {
    paddingBottom: '14px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  exampleLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
  },
  exampleSequence: {
    fontSize: '12px',
    color: 'var(--accent)',
    fontFamily: 'var(--font-mono)',
  },
  exampleResult: {
    fontSize: '11px',
    color: '#30d158',
    fontFamily: 'var(--font-mono)',
  },
  exampleDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.5',
  },
}