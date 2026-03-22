import { useState } from 'react'
import { simulateCircuit } from '../api'
import ProbabilityChart from './ProbabilityChart'
import ExportButton from './ExportButton'

// ── Constants ────────────────────────────────────────────────────
const STEPS    = 8   // number of columns in the grid
const MAX_QUBITS = 5

// Gate definitions — name, label shown in cell, and its CSS colour variable
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

// Helper — create an empty grid: 2D array [qubit][step] = null
function emptyGrid(nQubits) {
  return Array.from({ length: nQubits }, () => Array(STEPS).fill(null))
}

export default function CircuitBuilder() {
  const [nQubits,     setNQubits]     = useState(2)
  const [grid,        setGrid]        = useState(emptyGrid(2))
  const [selectedGate, setSelectedGate] = useState('H')
  const [cnotControl,  setCnotControl]  = useState(null)  // tracks CNOT placement state
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // ── Qubit count change ─────────────────────────────────────────
  // When the user changes qubit count, reset the grid entirely.
  // Keeping old gates when qubit count changes would cause index
  // mismatches — e.g. a gate on qubit 3 when there are only 2 qubits.
  function handleQubitChange(n) {
    setNQubits(n)
    setGrid(emptyGrid(n))
    setResult(null)
    setCnotControl(null)
  }

  // ── Cell click ────────────────────────────────────────────────
  // CNOT needs two clicks: first sets the control qubit,
  // second sets the target. Single-qubit gates place immediately.
  function handleCellClick(qubit, step) {
    if (selectedGate === 'CNOT') {
      if (cnotControl === null) {
        // First click — mark this qubit as the control
        setCnotControl({ qubit, step })
      } else {
        // Second click — place CNOT if same step, different qubit
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

    // Single-qubit gate — place or clear (clicking same gate toggles it off)
    const newGrid = grid.map(row => [...row])
    const existing = newGrid[qubit][step]
    if (existing && existing.gate === selectedGate) {
      newGrid[qubit][step] = null  // toggle off
    } else {
      newGrid[qubit][step] = { gate: selectedGate }
    }
    setGrid(newGrid)
  }

  // ── Clear grid ────────────────────────────────────────────────
  function handleClear() {
    setGrid(emptyGrid(nQubits))
    setResult(null)
    setError(null)
    setCnotControl(null)
  }

  // ── Run simulation ────────────────────────────────────────────
  // Read the grid left to right, collect gate instructions,
  // send to backend, store result for the chart to display.
  async function handleRun() {
    setLoading(true)
    setError(null)
    setResult(null)

    // Build ordered gate list from the grid
    // We scan column by column (step by step), then row by row (qubit by qubit)
    const gates = []
    for (let step = 0; step < STEPS; step++) {
      for (let qubit = 0; qubit < nQubits; qubit++) {
        const cell = grid[qubit][step]
        if (!cell) continue
        if (cell.gate === 'CNOT' && cell.role === 'control') {
          gates.push({ gate: 'CNOT', control: qubit, target: cell.linkedQubit })
        } else if (cell.gate !== 'CNOT') {
          gates.push({ gate: cell.gate, target: qubit })
        }
      }
    }

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

  // ── Cell appearance ───────────────────────────────────────────
  function getCellStyle(qubit, step) {
    const cell = grid[qubit][step]
    const isPending = 
      selectedGate === 'CNOT' &&
      cnotControl?.qubit === qubit &&
      cnotControl?.step === step

    let bg = 'transparent'
    let border = '1px solid var(--border)'
    let color = 'var(--text-secondary)'
    let label = '+'

    if (isPending) {
      bg = 'var(--accent-glow)'
      border = '1px dashed var(--accent)'
      label = '●'
      color = 'var(--accent)'
    } else if (cell) {
      const gateDef = GATES.find(g => g.id === cell.gate)
      bg = gateDef ? `${gateDef.color}22` : 'var(--bg-card)'
      border = `1px solid ${gateDef ? gateDef.color : 'var(--border)'}`
      color = gateDef ? gateDef.color : 'var(--text-primary)'
      label = cell.role === 'control' ? '●' : cell.role === 'target' ? '⊕' : gateDef?.label
    }

    return { bg, border, color, label }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* ── Title ── */}
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Circuit Playground</h2>
        <p style={styles.subtitle}>
          Select a gate, click cells to place it, then hit Run.
        </p>
      </div>

      {/* ── Controls row ── */}
      <div style={styles.controlsRow}>

        {/* Qubit selector */}
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
          <button
            onClick={handleRun}
            disabled={loading}
            style={{...styles.runBtn, opacity: loading ? 0.6 : 1}}
          >
            {loading ? 'Running...' : '▶ Run'}
          </button>
        </div>

      </div>

      {/* ── Gate toolbar ── */}
      {/* ── Gate toolbar ── */}
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
      {cnotControl ? 'Now click the target qubit in the same column' : 'Click control qubit first'}
    </span>
  )}
</div>

      {/* ── Circuit grid ── */}
      <div style={styles.gridWrapper}>

        {/* Qubit labels + wire rows */}
        {Array.from({ length: nQubits }, (_, qubit) => (
          <div key={qubit} style={styles.qubitRow}>
            <div style={styles.qubitLabel}>
              |q{qubit}⟩
                </div>
                <div style={styles.wireRow}>
                  {/* Wire line behind cells */}
                  <div style={styles.wire} />
                  {Array.from({ length: STEPS }, (_, step) => {
                    const { bg, border, color, label } = getCellStyle(qubit, step)
                    return (
                    <div
                    key={step}
                    onClick={() => handleCellClick(qubit, step)}
                    style={{
                    ...styles.cell,
                    background: bg,
                    border,
                    color,
                   }}
                >
                   {grid[qubit][step] || (
                      selectedGate === 'CNOT' &&
                      cnotControl?.qubit === qubit &&
                      cnotControl?.step === step
                    ) ? label : ''}
                  </div>
                 )
               })}
             </div>
           </div>
        ))}

        {/* Step numbers */}
        <div style={styles.stepLabels}>
          <div style={{width: '52px'}} />
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} style={styles.stepLabel}>{i + 1}</div>
          ))}
        </div>

      </div>

      {/* ── Error message ── */}
      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* ── Export button (only when circuit has gates) ── */}
      {grid.flat().some(Boolean) && (
        <ExportButton grid={grid} nQubits={nQubits} />
      )}

      {/* ── Results ── */}
      {result && (
        <div style={styles.results}>
          <h3 style={styles.resultsTitle}>Measurement Probabilities</h3>
          <ProbabilityChart probabilities={result.probabilities} />
        </div>
      )}

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────
const styles = {
  container: {
    maxWidth: '960px',
  },
  titleRow: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
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
    fontSize: '13px',
  },
  qubitBtns: {
    display: 'flex',
    gap: '6px',
  },
  qubitBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
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
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
  },
  runBtn: {
    padding: '8px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
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
    borderRadius: '8px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    transition: 'all 0.15s ease',
  },
  cnotHint: {
    color: 'var(--accent)',
    fontSize: '12px',
    marginLeft: '8px',
  },
  gridWrapper: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '20px 16px',
    marginBottom: '20px',
  },
  qubitRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  qubitLabel: {
    width: '52px',
    fontSize: '12px',
    color: 'var(--accent)',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  wireRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  cell: {
    width: '48px',
    height: '40px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.1s ease',
    flexShrink: 0,
    userSelect: 'none',
  },
  stepLabels: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    paddingLeft: '0px',
  },
  stepLabel: {
    width: '48px',
    textAlign: 'center',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  error: {
    color: '#ff6b6b',
    fontSize: '13px',
    padding: '10px 14px',
    background: '#ff6b6b11',
    borderRadius: '8px',
    border: '1px solid #ff6b6b44',
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
  },
  cell: {
  width: '48px',
  height: '40px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '700',
  transition: 'all 0.15s ease',
  flexShrink: 0,
  userSelect: 'none',
  position: 'relative',
  zIndex: 1,
},
  wire: {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '1px',
  background: 'linear-gradient(90deg, var(--accent) 0%, rgba(124,106,255,0.3) 100%)',
  transform: 'translateY(-50%)',
  zIndex: 0,
  pointerEvents: 'none',
},
}

