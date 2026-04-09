import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getBlochState } from '../api'

const GATES = [
  { id: 'H', label: 'H', color: '#7c6aff', desc: 'Hadamard — superposition' },
  { id: 'X', label: 'X', color: '#ff453a', desc: 'Pauli-X — bit flip' },
  { id: 'Y', label: 'Y', color: '#ff9f0a', desc: 'Pauli-Y — bit + phase flip' },
  { id: 'Z', label: 'Z', color: '#ffd60a', desc: 'Pauli-Z — phase flip' },
  { id: 'S', label: 'S', color: '#bf5af2', desc: 'S Gate — 90° phase' },
  { id: 'T', label: 'T', color: '#ff375f', desc: 'T Gate — 45° phase' },
]

function ThreeBloch({ blochX, blochY, blochZ }) {
  const mountRef    = useRef(null)
  const stateRef    = useRef({ x: 0, y: 0, z: 1 })
  const arrowObjRef = useRef(null)
  const rendererRef = useRef(null)
  const frameRef    = useRef(null)
  const isDragging  = useRef(false)
  const prevMouse   = useRef({ x: 0, y: 0 })
  const sphereRotRef = useRef({ x: 0.3, y: 0 })

  // Update arrow when props change
  useEffect(() => {
    stateRef.current = { x: blochX, y: blochY, z: blochZ }
  }, [blochX, blochY, blochZ])

  useEffect(() => {
    const container = mountRef.current
    const width  = container.clientWidth || 400
    const height = 400

    // ── Scene ──────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 3.5)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Main group — everything rotates together ───
    const mainGroup = new THREE.Group()
    scene.add(mainGroup)

    // ── Sphere ─────────────────────────────────────
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32)
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x7c6aff,
      transparent: true,
      opacity: 0.04,
      wireframe: false,
    })
    mainGroup.add(new THREE.Mesh(sphereGeo, sphereMat))

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x7c6aff,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    })
    mainGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16), wireMat
    ))

    // ── Equator ring ────────────────────────────────
    const equatorGeo = new THREE.TorusGeometry(1, 0.005, 8, 80)
    mainGroup.add(new THREE.Mesh(equatorGeo,
      new THREE.MeshBasicMaterial({ color: 0x7c6aff, transparent: true, opacity: 0.35 })
    ))

    // ── Meridian rings ──────────────────────────────
    const meridianGeo = new THREE.TorusGeometry(1, 0.003, 8, 80)
    const mRing1 = new THREE.Mesh(meridianGeo,
      new THREE.MeshBasicMaterial({ color: 0x7c6aff, transparent: true, opacity: 0.15 })
    )
    mRing1.rotation.y = Math.PI / 2
    mainGroup.add(mRing1)

    const mRing2 = new THREE.Mesh(meridianGeo,
      new THREE.MeshBasicMaterial({ color: 0x7c6aff, transparent: true, opacity: 0.15 })
    )
    mRing2.rotation.x = Math.PI / 2
    mainGroup.add(mRing2)

    // ── Axes ────────────────────────────────────────
    const axisLen = 1.4
    const axisData = [
      { dir: [1,0,0],  neg: [-1,0,0],  color: 0xff453a },
      { dir: [0,1,0],  neg: [0,-1,0],  color: 0x30d158 },
      { dir: [0,0,1],  neg: [0,0,-1],  color: 0x7c6aff },
    ]
    axisData.forEach(({ dir, neg, color }) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
      const pts = [
        new THREE.Vector3(...neg).multiplyScalar(axisLen),
        new THREE.Vector3(...dir).multiplyScalar(axisLen),
      ]
      mainGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts), mat
      ))
    })

    // ── Pole markers ────────────────────────────────
    const poleGeo = new THREE.SphereGeometry(0.045, 12, 12)
    const polePositions = [
      { pos: [0,  1.05, 0], color: 0x7c6aff },  // |0⟩ north
      { pos: [0, -1.05, 0], color: 0x7c6aff },  // |1⟩ south
      { pos: [ 1.05, 0, 0], color: 0xff453a },  // |+⟩
      { pos: [-1.05, 0, 0], color: 0xff453a },  // |−⟩
      { pos: [0, 0,  1.05], color: 0x30d158 },  // |i⟩
      { pos: [0, 0, -1.05], color: 0x30d158 },  // |−i⟩
    ]
    polePositions.forEach(({ pos, color }) => {
      const dot = new THREE.Mesh(poleGeo,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
      )
      dot.position.set(...pos)
      mainGroup.add(dot)
    })

    // ── State vector arrow ──────────────────────────
    // Built from primitives — line + cone + glow sphere
    // Rebuilt every frame from stateRef so it always
    // reflects the latest Bloch coordinates
    function buildStateVector() {
      // Remove old arrow
      if (arrowObjRef.current) {
        mainGroup.remove(arrowObjRef.current)
        arrowObjRef.current.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) obj.material.dispose()
        })
      }

      const { x, y, z } = stateRef.current
      // Bloch sphere: Z is up, but Three.js Y is up
      // Map: Bloch(x,y,z) → Three.js(x, z, y)
      const bx = x
      const by = z   // Bloch Z → Three.js Y
      const bz = y   // Bloch Y → Three.js Z

      const tip = new THREE.Vector3(bx, by, bz).normalize()
      const arrowGroup = new THREE.Group()

      // Shaft
      const shaftPts = [new THREE.Vector3(0,0,0), tip.clone().multiplyScalar(0.82)]
      arrowGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(shaftPts),
        new THREE.LineBasicMaterial({ color: 0x7c6aff, linewidth: 2 })
      ))

      // Cone head
      const coneGeo = new THREE.ConeGeometry(0.055, 0.18, 12)
      const coneMesh = new THREE.Mesh(coneGeo,
        new THREE.MeshBasicMaterial({ color: 0x7c6aff })
      )
      // Position cone at tip
      coneMesh.position.copy(tip.clone().multiplyScalar(0.91))
      // Align cone to point along tip direction
      coneMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        tip.clone().normalize()
      )
      arrowGroup.add(coneMesh)

      // Glow sphere at tip
      const glowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
      )
      glowMesh.position.copy(tip)
      arrowGroup.add(glowMesh)

      // Outer glow
      const outerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x7c6aff, transparent: true, opacity: 0.2 })
      )
      outerGlow.position.copy(tip)
      arrowGroup.add(outerGlow)

      mainGroup.add(arrowGroup)
      arrowObjRef.current = arrowGroup
    }

    // ── Lighting ────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const dLight = new THREE.DirectionalLight(0x7c6aff, 0.5)
    dLight.position.set(2, 3, 2)
    scene.add(dLight)

    // ── Mouse orbit controls ────────────────────────
    function onMouseDown(e) {
      isDragging.current = true
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    function onMouseMove(e) {
      if (!isDragging.current) return
      const dx = e.clientX - prevMouse.current.x
      const dy = e.clientY - prevMouse.current.y
      sphereRotRef.current.y += dx * 0.008
      sphereRotRef.current.x += dy * 0.008
      prevMouse.current = { x: e.clientX, y: e.clientY }
    }
    function onMouseUp() { isDragging.current = false }

    // Touch support for iPad
    function onTouchStart(e) {
      isDragging.current = true
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    function onTouchMove(e) {
      if (!isDragging.current) return
      const dx = e.touches[0].clientX - prevMouse.current.x
      const dy = e.touches[0].clientY - prevMouse.current.y
      sphereRotRef.current.y += dx * 0.008
      sphereRotRef.current.x += dy * 0.008
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    function onTouchEnd() { isDragging.current = false }

    renderer.domElement.addEventListener('mousedown',  onMouseDown)
    renderer.domElement.addEventListener('mousemove',  onMouseMove)
    renderer.domElement.addEventListener('mouseup',    onMouseUp)
    renderer.domElement.addEventListener('touchstart', onTouchStart)
    renderer.domElement.addEventListener('touchmove',  onTouchMove)
    renderer.domElement.addEventListener('touchend',   onTouchEnd)

    // ── Animation loop ──────────────────────────────
    // Sphere rotates slowly when not dragging
    // Arrow is rebuilt every frame from stateRef
    function animate() {
      frameRef.current = requestAnimationFrame(animate)

      if (!isDragging.current) {
        sphereRotRef.current.y += 0.003
      }

      mainGroup.rotation.x = sphereRotRef.current.x
      mainGroup.rotation.y = sphereRotRef.current.y

      buildStateVector()
      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ─────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.domElement.removeEventListener('mousedown',  onMouseDown)
      renderer.domElement.removeEventListener('mousemove',  onMouseMove)
      renderer.domElement.removeEventListener('mouseup',    onMouseUp)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove',  onTouchMove)
      renderer.domElement.removeEventListener('touchend',   onTouchEnd)
      renderer.dispose()
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '400px', cursor: 'grab' }}
    />
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
          Drag to rotate. Apply gates to see the state vector move.
          Every point on the sphere is a valid qubit state.
        </p>
      </div>

      <div style={styles.layout}>

        {/* ── Left panel ── */}
        <div style={styles.leftPanel}>

          <div style={styles.stateCard}>
            <div style={styles.stateCardLabel}>Current State</div>
            <div style={styles.stateSymbol}>{stateLabel}</div>
            <div style={styles.stateCoords}>
              {[['x', bloch.x], ['y', bloch.y], ['z', bloch.z]].map(([label, val]) => (
                <span key={label} style={styles.coord}>
                  <span style={styles.coordLabel}>{label} </span>
                  {Number(val).toFixed(3)}
                </span>
              ))}
            </div>
            <div style={styles.probRow}>
              {[['|0⟩', '0'], ['|1⟩', '1']].map(([label, key]) => (
                <div key={key} style={styles.probItem}>
                  <span style={styles.probLabel}>P({label})</span>
                  <span style={styles.probValue}>
                    {((probabilities[key] || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

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

          <div style={styles.noteCard}>
            <div style={styles.noteTitle}>⚠ Note on Entanglement</div>
            <div style={styles.noteText}>
              The Bloch sphere represents only single qubit states.
              Entangled qubits cannot be described by individual Bloch
              spheres — their states are fundamentally inseparable.
              This is what makes entanglement non-classical.
            </div>
          </div>

          <div style={styles.legendCard}>
            <div style={styles.sectionLabel}>Axis Guide</div>
            {[
              { color: '#7c6aff', text: 'Y axis — |0⟩ top, |1⟩ bottom' },
              { color: '#ff453a', text: 'X axis — |+⟩ to |−⟩' },
              { color: '#30d158', text: 'Z axis — |i⟩ to |−i⟩' },
            ].map((item, i) => (
              <div key={i} style={styles.legendRow}>
                <span style={{ ...styles.legendDot, background: item.color }} />
                <span style={styles.legendText}>{item.text}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ── Right panel — 3D sphere ── */}
        <div style={styles.rightPanel}>
          <div style={styles.sphereCard}>
            <ThreeBloch
              blochX={bloch.x}
              blochY={bloch.y}
              blochZ={bloch.z}
            />
          </div>

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
                desc: 'Z causes destructive interference after H — ends at south pole.'
              },
              {
                label: 'H is its own inverse',
                sequence: 'H → H',
                result: '|0⟩',
                desc: 'Two Hadamards cancel — returns to north pole.'
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
    marginBottom: '12px',
  },
  stateCoords: {
    display: 'flex', justifyContent: 'center',
    gap: '12px', marginBottom: '16px',
  },
  coord:      { fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' },
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
    fontWeight: '600', marginBottom: '6px',
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
    border: '1px solid var(--border)', overflow: 'hidden',
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