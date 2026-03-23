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
  }

  // ── Run simulation ─────────────────────────────────
  async function handleRun() {
    setLoading(true)
    setError(null)
    setResult(null)

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

      {/* Title */}
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Circuit Playground</h2>
        <p style={styles.subtitle}>
          Select a gate, click cells to place it, then hit Run.
        </p>
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
        <div style={styles.actionBtns}>
          <button onClick={handleClear} style={styles.clearBtn}>
            Clear
          </button>
          <button
            onClick={handleRun}
            disabled={loading}
            style={{ ...styles.runBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Running...' : '▶ Run'}
          </button>
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

      {/* Circuit grid */}
      <div style={styles.gridWrapper}>

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
            <div style={styles.wireRow}>
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

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Export */}
      {grid.flat().some(Boolean) && (
        <ExportButton grid={grid} nQubits={nQubits} />
      )}

      {/* Results */}
      {result && (
        <div style={styles.results}>
          <h3 style={styles.resultsTitle}>Measurement Probabilities</h3>
          <ProbabilityChart probabilities={result.probabilities} />
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
}