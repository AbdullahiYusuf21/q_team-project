import { useState, useRef, useEffect } from 'react'
import { simulateCircuit } from '../api'
import ProbabilityChart from './ProbabilityChart'
import ExportButton from './ExportButton'

const STEPS = 8
const MAX_QUBITS = 5
const CELL_WIDTH = 48
const CELL_GAP = 6
const CELL_HEIGHT = 40
const ROW_GAP = 8
const QUBIT_LABEL_WIDTH = 52
const PRESETS = [
  {
    id: 'bell',
    label: 'Bell State',
    description: 'Maximally entangled 2-qubit state',
    info: {
      name: 'Bell State  |Φ+⟩ = (|00⟩ + |11⟩)/√2',
      what: 'The Bell state is the simplest and most famous example of quantum entanglement. Two qubits become perfectly correlated — measuring one instantly determines the other, regardless of distance.',
      how: 'H puts qubit 0 into superposition (|0⟩+|1⟩)/√2. The CNOT then conditionally flips qubit 1 only when qubit 0 is |1⟩. Since qubit 0 is in superposition, both outcomes happen simultaneously — creating the entangled state.',
      expect: '50% probability on |00⟩ and 50% on |11⟩. The states |01⟩ and |10⟩ are exactly zero — the qubits are perfectly correlated and will never disagree.',
      physics: 'This demonstrates quantum entanglement. Einstein called this "spooky action at a distance" — the correlation exists before measurement and cannot be explained by classical physics.',
    },
    nQubits: 2,
    gates: [
      { qubit: 0, step: 0, gate: 'H' },
      { qubit: 0, step: 1, gate: 'CNOT', role: 'control', linkedQubit: 1 },
      { qubit: 1, step: 1, gate: 'CNOT', role: 'target',  linkedQubit: 0 },
    ]
  },
  {
    id: 'ghz',
    label: 'GHZ State',
    description: '3-qubit entanglement',
    info: {
      name: 'GHZ State  |GHZ⟩ = (|000⟩ + |111⟩)/√2',
      what: 'The Greenberger-Horne-Zeilinger state is a maximally entangled 3-qubit state. It generalises the Bell state to three qubits and is used in quantum error correction, quantum cryptography, and tests of quantum non-locality.',
      how: 'H on qubit 0 creates superposition. The first CNOT entangles qubit 1 with qubit 0. The second CNOT entangles qubit 2 with qubit 0. All three qubits are now linked through a single entangled state.',
      expect: '50% probability on |000⟩ and 50% on |111⟩. All other basis states — |001⟩, |010⟩, |011⟩, |100⟩, |101⟩, |110⟩ — have exactly zero probability.',
      physics: 'GHZ states provide the strongest possible violation of Bell inequalities, proving that quantum mechanics cannot be explained by any local hidden variable theory.',
    },
    nQubits: 3,
    gates: [
      { qubit: 0, step: 0, gate: 'H' },
      { qubit: 0, step: 1, gate: 'CNOT', role: 'control', linkedQubit: 1 },
      { qubit: 1, step: 1, gate: 'CNOT', role: 'target',  linkedQubit: 0 },
      { qubit: 0, step: 2, gate: 'CNOT', role: 'control', linkedQubit: 2 },
      { qubit: 2, step: 2, gate: 'CNOT', role: 'target',  linkedQubit: 0 },
    ]
  },
  {
    id: 'superposition',
    label: 'Full Superposition',
    description: 'All qubits in equal superposition',
    info: {
      name: 'Equal Superposition  H⊗³|000⟩ = |+⟩⊗³',
      what: 'Applying H to every qubit creates a uniform superposition of all 2ⁿ basis states simultaneously. This is the starting point for most quantum algorithms — it gives the quantum computer access to all possible inputs at once.',
      how: 'H is applied independently to each qubit. Since the qubits are not entangled with each other, the combined state is a simple tensor product: |+⟩ ⊗ |+⟩ ⊗ |+⟩.',
      expect: 'Equal probability of 12.5% on all 8 basis states: |000⟩, |001⟩, |010⟩, |011⟩, |100⟩, |101⟩, |110⟩, |111⟩. This is quantum parallelism — all states exist simultaneously.',
      physics: 'This illustrates quantum parallelism. A classical 3-bit register can only hold one of 8 values at a time. A 3-qubit register in superposition holds all 8 simultaneously — the foundation of quantum computational advantage.',
    },
    nQubits: 3,
    gates: [
      { qubit: 0, step: 0, gate: 'H' },
      { qubit: 1, step: 0, gate: 'H' },
      { qubit: 2, step: 0, gate: 'H' },
    ]
  },
  {
    id: 'phase-kickback',
    label: 'Phase Kickback',
    description: 'HZH = X — interference in action',
    info: {
      name: 'Phase Kickback  H → Z → H = X',
      what: 'This circuit demonstrates that Z — which appears to do nothing measurable on its own — creates a hidden phase difference that the second H gate converts into a completely different measurable outcome. It is the core mechanism behind both Deutsch-Jozsa and Grover\'s oracle.',
      how: 'H creates superposition (|0⟩+|1⟩)/√2. Z flips the phase of |1⟩ to give (|0⟩−|1⟩)/√2. The second H applies interference: the |0⟩ components cancel (destructive) and the |1⟩ components reinforce (constructive). Result: |1⟩ with 100% certainty.',
      expect: '100% probability on |1⟩. Starting from |0⟩, the sequence H → Z → H is mathematically identical to applying a single X gate — but achieved through phase manipulation and interference rather than a direct flip.',
      physics: 'This is quantum interference made visible. The Z gate encoded information as phase — invisible to measurement. The H gate decoded it back into amplitude — now visible. This phase-to-amplitude conversion is how quantum algorithms extract answers from oracles.',
    },
    nQubits: 1,
    gates: [
      { qubit: 0, step: 0, gate: 'H' },
      { qubit: 0, step: 1, gate: 'Z' },
      { qubit: 0, step: 2, gate: 'H' },
    ]
  },
  {
    id: 'teleportation',
    label: 'Teleportation Prep',
    description: 'Entanglement as a quantum resource',
    info: {
      name: 'Quantum Teleportation Preparation',
      what: 'Quantum teleportation transfers a qubit state from one location to another using a shared Bell pair and two classical bits. This circuit implements the preparation and encoding stages — demonstrating how entanglement is used as a resource to transmit quantum information.',
      how: 'A Bell pair is created between qubits 1 and 2 (the quantum channel). Qubit 0 (the message) is put into superposition with H, then a Bell measurement is performed on qubits 0 and 1 using CNOT and H. This encodes the message state into the entanglement correlations.',
      expect: 'The probabilities will be distributed across multiple states. The key insight is not the specific outcome but the protocol — the message qubit\'s state has been encoded into the joint system and can be reconstructed at qubit 2 using classical corrections.',
      physics: 'Quantum teleportation does not transmit matter or information faster than light. It uses a pre-shared entangled pair plus two classical bits to faithfully reconstruct an arbitrary qubit state. It proves that entanglement is a physical resource that can be consumed to transmit quantum information.',
    },
    nQubits: 3,
    gates: [
      { qubit: 1, step: 0, gate: 'H' },
      { qubit: 1, step: 1, gate: 'CNOT', role: 'control', linkedQubit: 2 },
      { qubit: 2, step: 1, gate: 'CNOT', role: 'target',  linkedQubit: 1 },
      { qubit: 0, step: 2, gate: 'H' },
      { qubit: 0, step: 3, gate: 'CNOT', role: 'control', linkedQubit: 1 },
      { qubit: 1, step: 3, gate: 'CNOT', role: 'target',  linkedQubit: 0 },
      { qubit: 0, step: 4, gate: 'H' },
    ]
  },
]
const GATES = [
  {
    id: 'H', label: 'H', color: 'var(--gate-h)',
    name: 'Hadamard',
    desc: 'Creates superposition. Puts |0⟩ into 50/50 state.'
  },
  {
    id: 'X', label: 'X', color: 'var(--gate-x)',
    name: 'Pauli-X',
    desc: 'Quantum NOT gate. Flips |0⟩ to |1⟩ and vice versa.'
  },
  {
    id: 'Y', label: 'Y', color: 'var(--gate-y)',
    name: 'Pauli-Y',
    desc: 'Flip with complex phase. Combines X and Z effects.'
  },
  {
    id: 'Z', label: 'Z', color: 'var(--gate-z)',
    name: 'Pauli-Z',
    desc: 'Phase flip. Negates |1⟩ amplitude, invisible alone.'
  },
  {
    id: 'S', label: 'S', color: 'var(--gate-s)',
    name: 'S Gate',
    desc: '90° phase rotation. S² = Z.'
  },
  {
    id: 'T', label: 'T', color: 'var(--gate-t)',
    name: 'T Gate',
    desc: '45° phase rotation. T² = S, used in quantum Fourier transform.'
  },
  {
    id: 'CNOT', label: 'CX', color: 'var(--gate-cnot)',
    name: 'CNOT',
    desc: 'Flips target if control is |1⟩. Creates entanglement.'
  },
]

function emptyGrid(nQubits) {
  return Array.from({ length: nQubits }, () => Array(STEPS).fill(null))
}
function format(index, nQubits) {
  return index.toString(2).padStart(nQubits, '0')
}

// Calculates the x center of a cell given its step index
// This is used to position the SVG line horizontally
function cellCenterX(step) {
  return QUBIT_LABEL_WIDTH + step * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2
}

// Calculates the y center of a qubit row given its index
// ROW_GAP + CELL_HEIGHT is the total height of one row including gap
function cellCenterY(qubit) {
  return qubit * (CELL_HEIGHT + ROW_GAP) + CELL_HEIGHT / 2
}

export default function CircuitBuilder() {
  const [nQubits,      setNQubits]      = useState(2)
  const [grid,         setGrid]         = useState(emptyGrid(2))
  const [selectedGate, setSelectedGate] = useState('H')
  const [cnotControl,  setCnotControl]  = useState(null)
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [stepIndex,    setStepIndex]    = useState(null)
  const [measured,       setMeasured]       = useState(null)
  const [measuring,      setMeasuring]      = useState(false)
  const [activePreset, setActivePreset] = useState(null)
  // ── Qubit count change ─────────────────────────────
  function handleQubitChange(n) {
    setNQubits(n)
    setGrid(emptyGrid(n))
    setResult(null)
    setCnotControl(null)
    setStepIndex(null)
  }

  // ── Cell click ─────────────────────────────────────
  function handleCellClick(qubit, step) {
    setActivePreset(null)
    if (selectedGate === 'CNOT') {
      if (cnotControl === null) {
        setCnotControl({ qubit, step })
      } else {
        if (cnotControl.step === step && cnotControl.qubit !== qubit) {
          const newGrid = grid.map(row => [...row])
          newGrid[cnotControl.qubit][step] = {
            gate: 'CNOT', role: 'control', linkedQubit: qubit
          }
          newGrid[qubit][step] = {
            gate: 'CNOT', role: 'target', linkedQubit: cnotControl.qubit
          }
          setGrid(newGrid)
        }
        setCnotControl(null)
      }
      return
    }

    const newGrid = grid.map(row => [...row])
    const existing = newGrid[qubit][step]
    if (existing && existing.gate === selectedGate) {
      newGrid[qubit][step] = null
    } else {
      newGrid[qubit][step] = { gate: selectedGate }
    }
    setGrid(newGrid)
  }

  // ── Clear ──────────────────────────────────────────
  function handleClear() {
    setGrid(emptyGrid(nQubits))
    setResult(null)
    setError(null)
    setCnotControl(null)
    setStepIndex(null)
    setMeasured(null)
    setMeasuring(false)
    setActivePreset(null)
  }
  // ── Load preset circuit ────────────────────────────
  // Builds the grid from a preset definition.
  // Each preset gate specifies qubit, step, gate name,
  // and for CNOT — role and linkedQubit.
  function loadPreset(preset) {
    const newGrid = emptyGrid(preset.nQubits)
    preset.gates.forEach(({ qubit, step, gate, role, linkedQubit }) => {
      newGrid[qubit][step] = role
        ? { gate, role, linkedQubit }
        : { gate }
    })
    setNQubits(preset.nQubits)
    setGrid(newGrid)
    setResult(null)
    setError(null)
    setCnotControl(null)
    setStepIndex(null)
    setMeasured(null)
    setActivePreset(preset) 
  }

  // ── Run simulation ─────────────────────────────────
  function buildGateList() {
  const gates = []
  for (let step = 0; step < STEPS; step++) {
    for (let qubit = 0; qubit < nQubits; qubit++) {
      const cell = grid[qubit][step]
      if (!cell) continue
      if (cell.gate === 'CNOT' && cell.role === 'control') {
        gates.push({ gate: 'CNOT', control: qubit, target: cell.linkedQubit })
      } else if (cell.gate === 'CNOT' && cell.role === 'target') {
        continue  // skip — already added from control cell
      } else {
        gates.push({ gate: cell.gate, target: qubit })
      }
    }
  }
  return gates
}

// ── Run all gates at once ───────────────────────────
async function handleRun() {
  setMeasured(null)
  setMeasuring(false)
  setLoading(true)
  setError(null)
  setResult(null)
  setStepIndex(null)

  const gates = buildGateList()

  if (gates.length === 0) {
    setError('Place at least one gate before running.')
    setLoading(false)
    return
  }

  try {
    const data = await simulateCircuit(nQubits, gates)
    setResult(data)
  } catch (err) {
    setError('Backend error — make sure uvicorn is running on port 8000.')
  } finally {
    setLoading(false)
  }
}
// ── Measure ────────────────────────────────────────
// Simulates wavefunction collapse using Born rule.
// Generates a random number and walks the probability
// distribution to find which basis state it collapses to.
// This is exactly how quantum measurement works physically.
function handleMeasure() {
  if (!result) return
  setMeasuring(true)
  setMeasured(null)

  // Short delay for dramatic effect
  setTimeout(() => {
    const probs = result.probabilities
    const random = Math.random()
    let cumulative = 0
    let outcome = null

    for (const [state, prob] of Object.entries(probs)) {
      cumulative += prob
      if (random <= cumulative) {
        outcome = state
        break
      }
    }

    // Fallback to last non-zero state if floating point issues
    if (!outcome) {
      outcome = Object.entries(probs)
        .filter(([, p]) => p > 0)
        .pop()[0]
    }

    setMeasured(outcome)
    setMeasuring(false)
  }, 600)
}

// ── Step through one gate at a time ────────────────
async function handleStepForward() {
  const allGates = buildGateList()
  

  if (allGates.length === 0) {
    setError('Place at least one gate before stepping.')
    return
  }

  const nextStep = stepIndex === null ? 1 : stepIndex + 1
  if (nextStep > allGates.length) return

  setLoading(true)
  setError(null)

  try {
    const data = await simulateCircuit(nQubits, allGates.slice(0, nextStep))
    setResult(data)
    setStepIndex(nextStep)
  } catch (err) {
    setError('Backend error — make sure uvicorn is running on port 8000.')
  } finally {
    setLoading(false)
  }

}

// ── Reset step mode ─────────────────────────────────
function handleStepReset() {
  setStepIndex(null)
  setResult(null)
  setError(null)
}

  // ── Cell appearance ────────────────────────────────
  function getCellStyle(qubit, step) {
    const cell = grid[qubit][step]
    const isPending =
      selectedGate === 'CNOT' &&
      cnotControl?.qubit === qubit &&
      cnotControl?.step === step

    let bg = 'transparent'
    let border = '1px solid var(--border)'
    let color = 'var(--text-tertiary)'
    let label = ''

    if (isPending) {
      bg = 'var(--accent-glow)'
      border = '1px dashed var(--accent)'
      label = '●'
      color = 'var(--accent)'
    } else if (cell) {
      const gateDef = GATES.find(g => g.id === cell.gate)
      bg = gateDef ? `${gateDef.color}18` : 'var(--bg-card)'
      border = `1px solid ${gateDef ? gateDef.color : 'var(--border)'}`
      color = gateDef ? gateDef.color : 'var(--text-primary)'
      label = cell.role === 'control' ? '●'
            : cell.role === 'target'  ? '⊕'
            : gateDef?.label
    }

    return { bg, border, color, label }
  }

  // ── Build CNOT connection lines for SVG overlay ────
  // Scans the grid for CNOT control cells and calculates
  // the start and end y positions for each vertical line
  function getCnotLines() {
    const lines = []
    for (let step = 0; step < STEPS; step++) {
      for (let qubit = 0; qubit < nQubits; qubit++) {
        const cell = grid[qubit][step]
        if (cell?.gate === 'CNOT' && cell?.role === 'control') {
          const targetQubit = cell.linkedQubit
          lines.push({
            x:  cellCenterX(step),
            y1: cellCenterY(Math.min(qubit, targetQubit)),
            y2: cellCenterY(Math.max(qubit, targetQubit)),
          })
        }
      }
    }
    return lines
  }

  const cnotLines = getCnotLines()

  // Total height of the SVG overlay —
  // must match the grid height exactly
  const svgHeight = nQubits * (CELL_HEIGHT + ROW_GAP) - ROW_GAP

  // ── Render ─────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* ── Title + Presets ── */}
      <div style={styles.titleRow}>
        <div style={styles.titleLeft}>
          <h2 style={styles.title}>Circuit Playground</h2>
          <p style={styles.subtitle}>
            Select a gate, click cells to place it, then hit Run.
          </p>
        </div>

        {/* Preset circuits dropdown */}
        <div style={styles.presetWrapper}>
          <span style={styles.presetLabel}>Presets</span>
          <div style={styles.presetBtns}>
            {PRESETS.map(preset => (
              <div key={preset.id} className="tooltip-wrapper">
                <button
                  onClick={() => loadPreset(preset)}
                  style={styles.presetBtn}
                >
                  {preset.label}
                </button>
                <div className="tooltip">
                  <div className="tooltip-title">{preset.label}</div>
                  <div className="tooltip-desc">{preset.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      

      {/* Controls row */}
      <div style={styles.controlsRow}>
        <div style={styles.controlGroup}>
          <span style={styles.controlLabel}>Qubits</span>
          <div style={styles.qubitBtns}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                onClick={() => handleQubitChange(n)}
                style={{
                  ...styles.qubitBtn,
                  ...(nQubits === n ? styles.qubitBtnActive : {})
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        {/* Action buttons */}
        <div style={styles.actionBtns}>
          <button onClick={handleClear} style={styles.clearBtn}>
            Clear
          </button>

          {/* Step controls — only show when there are gates placed */}
          {buildGateList().length > 0 && (
            <>
              <button
                onClick={handleStepReset}
                disabled={stepIndex === null}
                style={{
                  ...styles.clearBtn,
                  opacity: stepIndex === null ? 0.4 : 1,
                  color: 'var(--accent)',
                  borderColor: 'var(--accent)',
                }}
              >
                ↺ Reset
              </button>
              <button
                onClick={handleStepForward}
                disabled={loading}
                style={{
                  ...styles.runBtn,
                  background: 'transparent',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Step →
              </button>
            </>
          )}

          <button
            onClick={handleRun}
            disabled={loading}
            style={{ ...styles.runBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Running...' : '▶ Run'}
          </button>
          {/* Measure button — only shows after simulation */}
          {result && (
            <button
              onClick={handleMeasure}
              disabled={measuring}
              style={{
                ...styles.runBtn,
                background: 'transparent',
                border: '1px solid #30d158',
                color: '#30d158',
                opacity: measuring ? 0.6 : 1,
              }}
            >
              {measuring ? 'Collapsing...' : '⊕ Measure'}
            </button>
          )}
        </div>
      </div>

      {/* Gate toolbar */}
      <div style={styles.toolbar}>
        {GATES.map(gate => (
          <div key={gate.id} className="tooltip-wrapper">
            <button
              onClick={() => { setSelectedGate(gate.id); setCnotControl(null) }}
              style={{
                ...styles.gateBtn,
                borderColor: gate.color,
                color: selectedGate === gate.id ? 'var(--bg-primary)' : gate.color,
                background: selectedGate === gate.id ? gate.color : 'transparent',
              }}
            >
              {gate.label}
            </button>
            <div className="tooltip">
              <div className="tooltip-title">{gate.name}</div>
              <div className="tooltip-desc">{gate.desc}</div>
            </div>
          </div>
        ))}
        {selectedGate === 'CNOT' && (
          <span style={styles.cnotHint}>
            {cnotControl
              ? 'Now click the target qubit in the same column'
              : 'Click control qubit first'}
          </span>
        )}
      </div>
      {/* Step indicator */}
      {stepIndex !== null && (
          <div style={styles.stepIndicator}>
            <div style={styles.stepIndicatorDot} />
            Step {stepIndex} of {buildGateList().length} gates applied
          </div>
        )}

      {/* Circuit grid */}
      <div style={styles.er}>

        {/* SVG overlay for CNOT vertical lines
            Sits on top of the grid cells using absolute positioning
            pointer-events: none means clicks pass through to cells below */}
        <svg
          style={{
            position: 'absolute',
            top: 20,
            left: 0,
            width: '100%',
            height: svgHeight,
            pointerEvents: 'none',
            zIndex: 2,
            overflow: 'visible',
          }}
        >
          {cnotLines.map((line, i) => (
            <line
              key={i}
              x1={line.x}
              y1={line.y1}
              x2={line.x}
              y2={line.y2}
              stroke="var(--gate-cnot)"
              strokeWidth="1.5"
              strokeDasharray="none"
            />
          ))}
        </svg>

        {/* Qubit rows */}
        {Array.from({ length: nQubits }, (_, qubit) => (
          <div key={qubit} style={styles.qubitRow}>
            <div style={styles.qubitLabel}>|q{qubit}⟩</div>
            <div style={styles.wireRow} className="quantum-wire">
              <div style={styles.wire} />
              {Array.from({ length: STEPS }, (_, step) => {
                const { bg, border, color, label } = getCellStyle(qubit, step)
                return (
                  <div
                    key={step}
                    onClick={() => handleCellClick(qubit, step)}
                    className="gate-cell"
                    style={{
                      ...styles.cell,
                      background: bg,
                      border,
                      color,
                    }}
                  >
                    {label}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Step numbers */}
        <div style={styles.stepLabels}>
          <div style={{ width: `${QUBIT_LABEL_WIDTH}px`, flexShrink: 0 }} />
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} style={styles.stepLabel}>{i + 1}</div>
          ))}
        </div>

      </div>
      {/* ── Preset Information Panel ── */}
      {activePreset && result && (
        <div className="fade-slide-up" style={styles.presetInfoPanel}>

          {/* Header */}
          <div style={styles.presetInfoHeader}>
            <div style={styles.presetInfoIcon}>⚛</div>
            <div>
              <div style={styles.presetInfoName}>
                {activePreset.info.name}
              </div>
            </div>
          </div>

          {/* Four info sections */}
          <div style={styles.presetInfoGrid}>

            <div style={styles.presetInfoSection}>
              <div style={styles.presetInfoLabel}>What it is</div>
              <div style={styles.presetInfoText}>{activePreset.info.what}</div>
            </div>

            <div style={styles.presetInfoSection}>
              <div style={styles.presetInfoLabel}>How it works</div>
              <div style={styles.presetInfoText}>{activePreset.info.how}</div>
            </div>

            <div style={styles.presetInfoSection}>
              <div style={styles.presetInfoLabel}>What to expect</div>
              <div style={styles.presetInfoText}>{activePreset.info.expect}</div>
            </div>

            <div style={styles.presetInfoSection}>
              <div style={styles.presetInfoLabel}>Physics insight</div>
              <div style={styles.presetInfoText}>{activePreset.info.physics}</div>
            </div>

          </div>
        </div>
      )}

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Export */}
      {grid.flat().some(Boolean) && (
        <ExportButton grid={grid} nQubits={nQubits} />
      )}
      {/* Results */}
      {result && (
        <div style={styles.results}>

          {/* ── Statevector display ── */}
          <div style={styles.statevectorCard}>
            <div style={styles.statevectorHeader}>
              <h3 style={styles.resultsTitle}>State Vector</h3>
              <span style={styles.statevectorSubtitle}>
                Complex amplitudes — square to get probabilities
              </span>
            </div>
            <div style={styles.statevectorGrid}>
              {result.statevector.map((amp, i) => {
                const label     = format(i, result.n_qubits)
                const prob      = amp.real ** 2 + amp.imag ** 2
                const isNonZero = prob > 0.001
                if (!isNonZero) return null
                return (
                  <div key={i} style={styles.ampCard}>
                    <div style={styles.ampLabel}>|{label}⟩</div>
                    <div style={styles.ampValue}>
                      <span style={styles.ampReal}>
                        {amp.real >= 0 ? '' : '−'}
                        {Math.abs(amp.real).toFixed(4)}
                      </span>
                      {Math.abs(amp.imag) > 0.0001 && (
                        <span style={styles.ampImag}>
                          {amp.imag >= 0 ? ' + ' : ' − '}
                          {Math.abs(amp.imag).toFixed(4)}i
                        </span>
                      )}
                    </div>
                    <div style={styles.ampProb}>
                      {(prob * 100).toFixed(1)}%
                    </div>
                    {/* Probability bar */}
                    <div style={styles.ampBar}>
                      <div style={{
                        ...styles.ampBarFill,
                        width: `${prob * 100}%`,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* ── Measurement collapse ── */}
          {measuring && (
            <div style={styles.collapseCard}>
              <div style={styles.collapseAnimation}>
                <div style={styles.collapseDot} />
                <div style={styles.collapseText}>
                  Wavefunction collapsing...
                </div>
              </div>
            </div>
          )}

          {measured && !measuring && (
            <div className="fade-slide-up" style={styles.measureResult}>
              <div style={styles.measureResultIcon}>⊕</div>
              <div>
                <div style={styles.measureResultTitle}>
                  Measurement Outcome
                </div>
                <div style={styles.measureResultState}>
                  |{measured}⟩
                </div>
                <div style={styles.measureResultDesc}>
                  Wavefunction collapsed from superposition to a
                  definite state. Probability of this outcome
                  was {((result.probabilities[measured] || 0) * 100).toFixed(1)}%.
                  Run again for a new random outcome.
                </div>
              </div>
            </div>
          )}


          {/* ── Probability chart ── */}
          <h3 style={styles.resultsTitle}>Measurement Probabilities</h3>
          <ProbabilityChart
            probabilities={measured && !measuring
              ? Object.fromEntries(
                  Object.entries(result.probabilities).map(([k, v]) =>
                    [k, k === measured ? 1 : 0]
                  )
                )
              : result.probabilities
            }
          />

        </div>
      )}

    </div>
  )
}

const styles = {
  container: {
    maxWidth: '960px',
    position: 'relative',
  },
  titleRow: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titleLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  presetWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignment: 'flex-end',
  },
  presetlabel: {
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  presetBtns: {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
},
  presetBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-hover)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
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
    fontFamily: 'var(--font-text)',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  controlLabel: {
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontFamily: 'var(--font-text)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  qubitBtns: {
    display: 'flex',
    gap: '4px',
  },
  qubitBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid var(--border-hover)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    transition: 'all 0.15s ease',
  },
  qubitBtnActive: {
    background: 'var(--accent-glow)',
    border: '1px solid var(--accent)',
    color: 'var(--text-primary)',
  },
  actionBtns: {
    display: 'flex',
    gap: '8px',
  },
  clearBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-hover)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    transition: 'all 0.15s ease',
  },
  runBtn: {
    padding: '8px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    fontWeight: '600',
    transition: 'all 0.15s ease',
    letterSpacing: '0.02em',
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  gateBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    transition: 'all 0.15s ease',
  },
  cnotHint: {
    color: 'var(--accent)',
    fontSize: '12px',
    fontFamily: 'var(--font-text)',
    marginLeft: '8px',
  },
  gridWrapper: {
    background: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    padding: '20px 16px',
    marginBottom: '20px',
    position: 'relative',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  qubitRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: `${ROW_GAP}px`,
    height: `${CELL_HEIGHT}px`,
  },
  qubitLabel: {
    width: `${QUBIT_LABEL_WIDTH}px`,
    fontSize: '12px',
    color: 'var(--accent)',
    fontFamily: 'var(--font-text)',
    fontWeight: '500',
    flexShrink: 0,
    letterSpacing: '0.02em',
  },
  wireRow: {
    display: 'flex',
    gap: `${CELL_GAP}px`,
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  wire: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, var(--accent) 0%, rgba(124,106,255,0.2) 100%)',
    transform: 'translateY(-50%)',
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  cell: {
    width: `${CELL_WIDTH}px`,
    height: `${CELL_HEIGHT}px`,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    transition: 'all 0.12s ease',
    flexShrink: 0,
    userSelect: 'none',
    position: 'relative',
    zIndex: 1,
  },
  stepLabels: {
    display: 'flex',
    gap: `${CELL_GAP}px`,
    marginTop: '8px',
  },
  stepLabel: {
    width: `${CELL_WIDTH}px`,
    textAlign: 'center',
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-text)',
    flexShrink: 0,
    letterSpacing: '0.04em',
  },
  error: {
    color: '#ff453a',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    padding: '10px 14px',
    background: 'rgba(255,69,58,0.08)',
    borderRadius: '10px',
    border: '1px solid rgba(255,69,58,0.2)',
    marginBottom: '16px',
  },
  results: {
    marginTop: '8px',
  },
  resultsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '16px',
    letterSpacing: '-0.01em',
  },
stepIndicator: {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
  fontSize: '12px',
  color: 'var(--accent)',
  fontFamily: 'var(--font-text)',
},
stepIndicatorDot: {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--accent)',
  animation: 'pulse 1.5s ease infinite',
},
statevectorCard: {
  background: 'var(--bg-card)',
  borderRadius: '14px',
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: '20px',
},
statevectorHeader: {
  display: 'flex',
  alignItems: 'baseline',
  gap: '12px',
  marginBottom: '16px',
},
statevectorSubtitle: {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
},
statevectorGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '10px',
},
ampCard: {
  background: 'var(--bg-elevated)',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
},
ampLabel: {
  fontSize: '14px',
  color: 'var(--accent)',
  fontFamily: 'var(--font-mono)',
  fontWeight: '600',
  letterSpacing: '0.02em',
},
ampValue: {
  fontSize: '12px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-primary)',
},
ampReal: {
  color: 'var(--text-primary)',
},
ampImag: {
  color: '#bf5af2',
},
ampProb: {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
},
ampBar: {
  height: '3px',
  background: 'var(--border)',
  borderRadius: '2px',
  overflow: 'hidden',
  marginTop: '4px',
},
ampBarFill: {
  height: '100%',
  background: 'var(--accent)',
  borderRadius: '2px',
  transition: 'width 0.4s ease',
},
collapseCard: {
  background: 'var(--bg-card)',
  borderRadius: '14px',
  border: '1px solid var(--border)',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
},
collapseAnimation: {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
},
collapseDot: {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: '#30d158',
  animation: 'pulse 0.6s ease infinite',
},
collapseText: {
  fontSize: '13px',
  color: '#30d158',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
},
measureResult: {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  background: 'rgba(48, 209, 88, 0.06)',
  borderRadius: '14px',
  border: '1px solid rgba(48, 209, 88, 0.25)',
  padding: '20px',
},
measureResultIcon: {
  fontSize: '28px',
  color: '#30d158',
  flexShrink: 0,
  fontFamily: 'var(--font-mono)',
},
measureResultTitle: {
  fontSize: '11px',
  color: 'rgba(48, 209, 88, 0.7)',
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '4px',
},
measureResultState: {
  fontSize: '32px',
  color: '#30d158',
  fontFamily: 'var(--font-mono)',
  fontWeight: '300',
  letterSpacing: '-0.02em',
  marginBottom: '8px',
},
measureResultDesc: {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
  lineHeight: '1.6',
},
presetInfoPanel: {
  background: 'rgba(255, 159, 10, 0.06)',
  borderRadius: '14px',
  border: '1px solid rgba(255, 159, 10, 0.25)',
  padding: '20px 24px',
  marginBottom: '20px',
},
presetInfoHeader: {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  paddingBottom: '14px',
  borderBottom: '1px solid rgba(255, 159, 10, 0.2)',
},
presetInfoIcon: {
  fontSize: '22px',
  flexShrink: 0,
},
presetInfoName: {
  fontSize: '14px',
  fontWeight: '700',
  color: '#ff9f0a',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '-0.01em',
},
presetInfoGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
},
presetInfoSection: {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
},
presetInfoLabel: {
  fontSize: '10px',
  color: '#ff9f0a',
  fontFamily: 'var(--font-mono)',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  opacity: 0.8,
},
presetInfoText: {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
  lineHeight: '1.65',
},
}
