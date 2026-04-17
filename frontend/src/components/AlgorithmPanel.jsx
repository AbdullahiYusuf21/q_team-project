import { useState } from 'react'
import ProbabilityChart from './ProbabilityChart'
import { runDeutschJozsa, runGrover } from '../api'

// ─────────────────────────────────────────────────────
// ALGORITHM PANEL
// Two algorithms: Deutsch-Jozsa and Grover's Search
// Each has a configuration panel, circuit diagram,
// run button, probability chart, and educational walkthrough
// ─────────────────────────────────────────────────────

const ALGORITHMS = [
  { id: 'deutsch-jozsa', label: 'Deutsch-Jozsa' },
  { id: 'grover',        label: "Grover's Search" },
]

// Step-by-step explanation of what happens at each
// stage of the Deutsch-Jozsa circuit
const DJ_STEPS = [
  {
    gate: 'Initialise',
    title: 'Initialise Qubits',
    explanation: 'Both qubits start as |0⟩. We flip the ancilla qubit to |1⟩ using an X gate so it can encode oracle results as phase kickback.',
  },
  {
    gate: 'Hadamard',
    title: 'Apply Hadamard Gates',
    explanation: 'H is applied to both qubits. The input qubit enters superposition (|0⟩+|1⟩)/√2, allowing us to query f(0) and f(1) simultaneously. This is quantum parallelism.',
  },
  {
    gate: 'Oracle',
    title: 'Oracle Query',
    explanation: 'The oracle encodes f(x). A constant oracle leaves the input qubit phase unchanged. A balanced oracle (CNOT) flips the phase of |1⟩ via phase kickback from the ancilla.',
  },
  {
    gate: 'Final H',
    title: 'Final Hadamard on Input',
    explanation: 'The second H converts phase differences into amplitude differences. Constructive interference → |0⟩ (constant). Destructive interference → |1⟩ (balanced).',
  },
  {
    gate: 'Measure',
    title: 'Measure Input Qubit',
    explanation: 'If qubit 0 collapses to |0⟩ → function is constant. If it collapses to |1⟩ → function is balanced. One query. Classically you need two.',
  },
]
const GROVER_STEPS = [
  {
    gate: 'Superposition',
    title: 'Equal Superposition',
    explanation: 'H applied to all qubits. Every basis state |00⟩, |01⟩, |10⟩, |11⟩ gets equal amplitude 1/2. Probability of each is 25% — a completely random starting point.',
  },
  {
    gate: 'Oracle',
    title: 'Oracle — Phase Flip',
    explanation: 'The oracle knows the target. It flips the phase of the target state from +amplitude to -amplitude. This is invisible to measurement but encodes the answer as a phase difference.',
  },
  {
    gate: 'Diffusion',
    title: 'Diffusion — Amplitude Amplification',
    explanation: 'The diffusion operator inverts all amplitudes about their average. The target\'s negative amplitude gets amplified to near 1.0 while all others shrink toward 0. One iteration gives ~100% on the target.',
  },
  {
    gate: 'Measure',
    title: 'Measurement',
    explanation: 'Measuring now collapses to the target state with near 100% probability. Classically you\'d need on average N/2 = 2 queries. Grover\'s needed 1 — quadratic speedup demonstrated.',
  },
]

export default function AlgorithmPanel() {
  const [activeAlgorithm, setActiveAlgorithm] = useState('deutsch-jozsa')
  const [oracleType,      setOracleType]      = useState('constant_0')
  const [result,          setResult]          = useState(null)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)
  const [djActiveStep,     setdjActiveStep]     = useState(null)
  const [groverActiveStep, setGroverActiveStep] = useState(null)
  const [groverTarget,  setGroverTarget]  = useState('11')
  const [groverResult,  setGroverResult]  = useState(null)
  const [groverLoading, setGroverLoading] = useState(false)
  const [groverError,   setGroverError]   = useState(null)

  // ── Run Deutsch-Jozsa ────────────────────────────
  async function handleRunDJ() {
    setLoading(true)
    setError(null)
    setResult(null)
    setdjActiveStep(null)

    try {
      const data = await runDeutschJozsa(oracleType)
      setResult(data)
    } catch (err) {
      setError('Backend error — make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  // ── Read the verdict from probabilities ──────────
  // We only care about qubit 0 (most significant bit)
  // If all probability is on states starting with '0' → constant
  // If all probability is on states starting with '1' → balanced
  function getVerdict(probabilities) {
    if (!probabilities) return null
    const qubit0is0 = (probabilities['00'] || 0) + (probabilities['01'] || 0)
    const qubit0is1 = (probabilities['10'] || 0) + (probabilities['11'] || 0)
    if (qubit0is0 > 0.99) return 'constant'
    if (qubit0is1 > 0.99) return 'balanced'
    return null
  }
  async function handleRunGrover() {
  setGroverLoading(true)
  setGroverError(null)
  setGroverResult(null)

  try {
    const data = await runGrover(groverTarget)
    setGroverResult(data)
  } catch (err) {
    setGroverError('Backend error — make sure the server is running.')
  } finally {
    setGroverLoading(false)
  }
}
  const verdict = result ? getVerdict(result.probabilities) : null

  // ── Circuit diagram for Deutsch-Jozsa ────────────
  // A static visual showing the circuit structure
  function DJCircuitDiagram() {
    const oracle = oracleType === 'balanced' ? 'CNOT' : oracleType === 'constant_1' ? 'X' : 'I'
    return (
      <div style={styles.circuitDiagram}>
        <div style={styles.circuitRow}>
          <span style={styles.qubitLabel}>|q₀⟩</span>
          <div style={styles.wire} />
          <div style={styles.gateBox('#7c6aff')}>H</div>
          <div style={styles.wire} />
          <div style={styles.gateBox('#ff9f0a')}>{oracle === 'CNOT' ? '●' : oracle}</div>
          <div style={styles.wire} />
          <div style={styles.gateBox('#7c6aff')}>H</div>
          <div style={styles.wire} />
          <div style={styles.measureBox}>M</div>
        </div>

        {oracle === 'CNOT' && (
          <div style={styles.cnotConnector} />
        )}

        <div style={styles.circuitRow}>
          <span style={styles.qubitLabel}>|q₁⟩</span>
          <div style={styles.wire} />
          <div style={styles.gateBox('#ff453a')}>X</div>
          <div style={styles.wire} />
          <div style={styles.gateBox('#7c6aff')}>H</div>
          <div style={styles.wire} />
          <div style={styles.gateBox('#ff9f0a')}>{oracle === 'CNOT' ? '⊕' : oracle}</div>
          <div style={styles.wire} />
          <div style={styles.wireEnd} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>

      {/* ── Algorithm selector ── */}
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Quantum Algorithms</h2>
        <p style={styles.subtitle}>
          Step-by-step demonstrations of quantum computational advantage.
        </p>
      </div>

      <div style={styles.algorithmTabs}>
        {ALGORITHMS.map(algo => (
          <button
            key={algo.id}
            onClick={() => {
              setActiveAlgorithm(algo.id)
              setResult(null)
              setError(null)
              setdjActiveStep(null)
            }}
            style={{
              ...styles.algoTab,
              ...(activeAlgorithm === algo.id ? styles.algoTabActive : {})
            }}
          >
            {algo.label}
          </button>
        ))}
      </div>

      {/* ── Deutsch-Jozsa Panel ── */}
      {activeAlgorithm === 'deutsch-jozsa' && (
        <div style={styles.panel}>

          {/* Description */}
          <div style={styles.descriptionCard}>
            <h3 style={styles.cardTitle}>The Problem</h3>
            <p style={styles.cardText}>
              Given a black-box function f(x) that is either <strong>constant</strong> (always 0 or always 1)
              or <strong>balanced</strong> (returns 0 for half inputs, 1 for the other half) —
              determine which it is.
            </p>
            <div style={styles.advantageRow}>
              <div style={styles.advantageItem}>
                <span style={styles.advantageLabel}>Classical</span>
                <span style={styles.advantageValue}>2 queries</span>
              </div>
              <div style={styles.advantageDivider}>vs</div>
              <div style={styles.advantageItem}>
                <span style={styles.advantageLabel}>Quantum</span>
                <span style={styles.advantageValue}>1 query</span>
              </div>
            </div>
          </div>

          {/* Oracle selector */}
          <div style={styles.configRow}>
            <span style={styles.configLabel}>Oracle Type</span>
            <div style={styles.oracleBtns}>
              {[
                { id: 'constant_0', label: 'Constant 0' },
                { id: 'constant_1', label: 'Constant 1' },
                { id: 'balanced',   label: 'Balanced'   },
              ].map(o => (
                <button
                  key={o.id}
                  onClick={() => {
                    setOracleType(o.id)
                    setResult(null)
                    setdjActiveStep(null)
                  }}
                  style={{
                    ...styles.oracleBtn,
                    ...(oracleType === o.id ? styles.oracleBtnActive : {})
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Circuit diagram */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Circuit</h3>
            <DJCircuitDiagram />
          </div>

          {/* Step-by-step walkthrough */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>How It Works</h3>
            <div style={styles.stepsRow}>
              {DJ_STEPS.map((step, i) => (
                <div
                  key={i}
                  onClick={() => setdjActiveStep(djActiveStep === i ? null : i)}
                  style={{
                    ...styles.stepPill,
                    ...(djActiveStep === i ? styles.stepPillActive : {})
                  }}
                >
                  <span style={styles.stepNumber}>{i + 1}</span>
                  {step.gate}
                </div>
              ))}
            </div>
            {djActiveStep !== null && (
              <div style={styles.stepExplanation}>
                <div style={styles.stepExplanationTitle}>
                  {DJ_STEPS[djActiveStep].title}
                </div>
                <div style={styles.stepExplanationText}>
                  {DJ_STEPS[djActiveStep].explanation}
                </div>
              </div>
            )}
          </div>

          {/* Run button */}
          <button
            onClick={handleRunDJ}
            disabled={loading}
            style={{ ...styles.runBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Running...' : '▶ Run Deutsch-Jozsa'}
          </button>

          {/* Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Result */}
          {result && (
            <div className="fade-slide-up" style={styles.resultSection}>

              {/* Verdict banner */}
              <div style={{
                ...styles.verdictBanner,
                background: verdict === 'constant'
                  ? 'rgba(48, 209, 88, 0.1)'
                  : 'rgba(124, 106, 255, 0.1)',
                borderColor: verdict === 'constant'
                  ? 'rgba(48, 209, 88, 0.3)'
                  : 'rgba(124, 106, 255, 0.3)',
              }}>
                <span style={styles.verdictIcon}>
                  {verdict === 'constant' ? '✓' : '⚡'}
                </span>
                <div>
                  <div style={styles.verdictTitle}>
                    Function is {verdict?.toUpperCase()}
                  </div>
                  <div style={styles.verdictSubtitle}>
                    {verdict === 'constant'
                      ? 'Qubit 0 collapsed to |0⟩ — constructive interference confirmed.'
                      : 'Qubit 0 collapsed to |1⟩ — destructive interference confirmed.'}
                  </div>
                </div>
              </div>

              <h3 style={styles.sectionTitle}>Measurement Probabilities</h3>
              <ProbabilityChart probabilities={result.probabilities} />

            </div>
          )}

        </div>
      )}

      {/* ── Grover's Panel (placeholder) ── */}
      {activeAlgorithm === 'grover' && (
        <div style={styles.panel}>

          {/* Description */}
          <div style={styles.descriptionCard}>
            <h3 style={styles.cardTitle}>The Problem</h3>
            <p style={styles.cardText}>
              Given an unsorted list of <strong>4 items</strong>, find the marked one.
              Classically this takes on average 2 queries. Grover's algorithm
              finds it in <strong>1 iteration</strong> — a quadratic speedup.
            </p>
            <div style={styles.advantageRow}>
            <div style={styles.advantageItem}>
              <span style={styles.advantageLabel}>Classical</span>
              <span style={styles.advantageValue}>2 queries</span>
            </div>
            <div style={styles.advantageDivider}>vs</div>
            <div style={styles.advantageItem}>
              <span style={styles.advantageLabel}>Quantum</span>
              <span style={styles.advantageValue}>1 query</span>
            </div>
          </div>
        </div>

        {/* Target selector */}
        <div style={styles.configRow}>
          <span style={styles.configLabel}>Search Target</span>
          <div style={styles.oracleBtns}>
            {['00', '01', '10', '11'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setGroverTarget(t)
                  setGroverResult(null)
                  setGroverActiveStep(null)
                }}
                style={{
                  ...styles.oracleBtn,
                  ...(groverTarget === t ? styles.oracleBtnActive : {})
                }}
              >
                |{t}⟩
              </button>
            ))}
          </div>
        </div>

        {/* Circuit diagram */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Circuit</h3>
          <div style={styles.circuitDiagram}>
            <div style={styles.circuitRow}>
              <span style={styles.qubitLabel}>|q₀⟩</span>
              <div style={styles.wire} />
              <div style={styles.gateBox('#7c6aff')}>H</div>
              <div style={styles.wire} />
              <div style={styles.gateBox('#ff9f0a')}>Oracle</div>
              <div style={styles.wire} />
              <div style={styles.gateBox('#30d158')}>Diffuse</div>
              <div style={styles.wire} />
              <div style={styles.measureBox}>M</div>
            </div>
            <div style={styles.circuitRow}>
              <span style={styles.qubitLabel}>|q₁⟩</span>
              <div style={styles.wire} />
              <div style={styles.gateBox('#7c6aff')}>H</div>
              <div style={styles.wire} />
              <div style={styles.gateBox('#ff9f0a')}>Oracle</div>
              <div style={styles.wire} />
              <div style={styles.gateBox('#30d158')}>Diffuse</div>
              <div style={styles.wire} />
              <div style={styles.measureBox}>M</div>
            </div>
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'var(--accent-glow)',
              borderRadius: '8px',
              border: '1px solid var(--accent)',
              fontSize: '12px',
              color: 'var(--accent)',
              fontFamily: 'var(--font-text)',
            }}>
              Searching for: |{groverTarget}⟩
            </div>
          </div>
        </div>

        {/* Step walkthrough */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>How It Works</h3>
          <div style={styles.stepsRow}>
            {GROVER_STEPS.map((step, i) => (
              <div
                key={i}
                onClick={() => setGroverActiveStep(groverActiveStep === i ? null : i)}
                style={{
                  ...styles.stepPill,
                  ...(groverActiveStep === i ? styles.stepPillActive : {})
                }}
              >
                <span style={styles.stepNumber}>{i + 1}</span>
                {step.gate}
              </div>
            ))}
          </div>
          {groverActiveStep !== null && (
            <div style={styles.stepExplanation}>
              <div style={styles.stepExplanationTitle}>
                {GROVER_STEPS[groverActiveStep].title}
              </div>
              <div style={styles.stepExplanationText}>
                {GROVER_STEPS[groverActiveStep].explanation}
              </div>
            </div>
          )}
        </div>

        {/* Run button */}
        <button
          onClick={handleRunGrover}
          disabled={groverLoading}
          style={{ ...styles.runBtn, opacity: groverLoading ? 0.6 : 1 }}
        >
          {groverLoading ? 'Searching...' : `▶ Search for |${groverTarget}⟩`}
        </button>

        {/* Error */}
        {groverError && <div style={styles.error}>{groverError}</div>}

        {/* Result */}
        {groverResult && (
          <div className="fade-slide-up"  style={styles.resultSection}>
            <div style={{
              ...styles.verdictBanner,
              background: 'rgba(48, 209, 88, 0.1)',
              borderColor: 'rgba(48, 209, 88, 0.3)',
            }}>
              <span style={styles.verdictIcon}>🎯</span>
              <div>
                <div style={styles.verdictTitle}>
                  Target |{groverTarget}⟩ Found
                </div>
                <div style={styles.verdictSubtitle}>
                  Amplitude amplification collapsed to target with ~100% probability.
                  Quadratic speedup over classical search demonstrated.
                </div>
              </div>
            </div>
            <h3 style={styles.sectionTitle}>Measurement Probabilities</h3>
            <ProbabilityChart probabilities={groverResult.probabilities} />
          </div>
        )}

      </div>
    )}

    </div>
  )
}

// ── Styles ────────────────────────────────────────────
const styles = {
  container: {
    maxWidth: '860px',
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
  algorithmTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
  },
  algoTab: {
    padding: '9px 20px',
    borderRadius: '10px',
    border: '1px solid var(--border-hover)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    fontWeight: '500',
    transition: 'all 0.15s ease',
  },
  algoTabActive: {
    background: 'var(--accent-glow)',
    border: '1px solid var(--accent)',
    color: 'var(--text-primary)',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
  },
  descriptionCard: {
    background: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    padding: '20px 24px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    letterSpacing: '-0.01em',
  },
  cardText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-text)',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  advantageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  advantageItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  advantageLabel: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-text)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  advantageValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--accent)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
  },
  advantageDivider: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-text)',
  },
  configRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  configLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-text)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    flexShrink: 0,
  },
  oracleBtns: {
    display: 'flex',
    gap: '6px',
  },
  oracleBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-hover)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-text)',
    transition: 'all 0.15s ease',
  },
  oracleBtnActive: {
    background: 'var(--accent-glow)',
    border: '1px solid var(--accent)',
    color: 'var(--text-primary)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontFamily: 'var(--font-text)',
  },
  circuitDiagram: {
    background: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'relative',
  },
  circuitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  qubitLabel: {
    width: '36px',
    fontSize: '12px',
    color: 'var(--accent)',
    fontFamily: 'var(--font-text)',
    fontWeight: '500',
    flexShrink: 0,
  },
  wire: {
    flex: 1,
    height: '1px',
    background: 'linear-gradient(90deg, var(--accent), rgba(124,106,255,0.2))',
    minWidth: '16px',
  },
  wireEnd: {
    width: '32px',
    height: '1px',
    background: 'rgba(124,106,255,0.2)',
  },
  gateBox: (color) => ({
    width: '36px',
    height: '32px',
    borderRadius: '6px',
    border: `1px solid ${color}`,
    background: `${color}18`,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
    flexShrink: 0,
  }),
  measureBox: {
    width: '36px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--text-tertiary)',
    background: 'transparent',
    color: 'var(--text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
    flexShrink: 0,
  },
  cnotConnector: {
    position: 'absolute',
    left: '148px',
    top: '36px',
    width: '1.5px',
    height: '44px',
    background: '#ff9f0a',
  },
  stepsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  stepPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid var(--border-hover)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-text)',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  stepPillActive: {
    background: 'var(--accent-glow)',
    border: '1px solid var(--accent)',
    color: 'var(--text-primary)',
  },
  stepNumber: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '9px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepExplanation: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '16px 20px',
    marginTop: '4px',
  },
  stepExplanationTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
    fontFamily: 'var(--font-display)',
  },
  stepExplanationText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-text)',
    lineHeight: '1.6',
  },
  runBtn: {
    padding: '10px 28px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    fontWeight: '600',
    transition: 'all 0.15s ease',
    alignSelf: 'flex-start',
    letterSpacing: '0.02em',
  },
  error: {
    color: '#ff453a',
    fontSize: '13px',
    fontFamily: 'var(--font-text)',
    padding: '10px 14px',
    background: 'rgba(255,69,58,0.08)',
    borderRadius: '10px',
    border: '1px solid rgba(255,69,58,0.2)',
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  verdictBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid',
  },
  verdictIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  verdictTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.01em',
    marginBottom: '2px',
  },
  verdictSubtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-text)',
  },
}