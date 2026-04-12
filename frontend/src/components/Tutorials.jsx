import { useState } from 'react'

// ─────────────────────────────────────────────────────
// TUTORIALS TAB
// Five concept modules bridging theory and the simulator.
// Each module has a plain-English explanation, key equation,
// concrete simulator example, and a "Try it" button that
// switches the active tab — closing the loop between
// reading and doing (constructivist learning).
// ─────────────────────────────────────────────────────

const MODULES = [
  {
    id: 'qubit',
    number: '01',
    title: 'What is a Qubit?',
    color: '#7c6aff',
    summary: 'The fundamental unit of quantum information.',
    content: [
      {
        type: 'text',
        text: 'A classical bit is always either 0 or 1 — like a light switch that is either off or on. A qubit can exist in a superposition of both 0 and 1 simultaneously, described by two complex amplitudes α and β.',
      },
      {
        type: 'equation',
        label: 'General qubit state',
        eq: '|ψ⟩ = α|0⟩ + β|1⟩',
        constraint: 'where  |α|² + |β|² = 1',
      },
      {
        type: 'text',
        text: 'The constraint |α|² + |β|² = 1 is the Born rule — squaring the amplitudes gives measurement probabilities that must sum to 1. When you measure a qubit, the superposition collapses to either |0⟩ with probability |α|² or |1⟩ with probability |β|².',
      },
      {
        type: 'example',
        label: 'Simulator example',
        text: 'In the Playground, all qubits start as |0⟩ — α=1, β=0. Apply the H gate to create equal superposition: α = β = 1/√2. The probability chart will show 50% |0⟩ and 50% |1⟩.',
        action: 'playground',
        actionLabel: 'Try in Playground →',
      },
      {
        type: 'insight',
        text: 'Quantum parallelism arises because a register of n qubits can represent 2ⁿ states simultaneously. 300 qubits can represent more states than there are atoms in the observable universe.',
      },
    ],
  },
  {
    id: 'gates',
    number: '02',
    title: 'Quantum Gates',
    color: '#30d158',
    summary: 'Unitary operations that transform qubit states.',
    content: [
      {
        type: 'text',
        text: 'Quantum gates are the quantum equivalent of classical logic gates. Every gate is a unitary matrix — meaning it is reversible and preserves the total probability (normalization) of the state. This is why quantum computing is fundamentally reversible, unlike classical computing.',
      },
      {
        type: 'equation',
        label: 'Unitarity condition',
        eq: 'U†U = I',
        constraint: 'U† is the conjugate transpose of U',
      },
      {
        type: 'gatelist',
        gates: [
          { name: 'H', color: '#7c6aff', desc: 'Creates superposition. Moves |0⟩ to (|0⟩+|1⟩)/√2 — the equator of the Bloch sphere.' },
          { name: 'X', color: '#ff453a', desc: 'Quantum NOT. Flips |0⟩ to |1⟩ and |1⟩ to |0⟩ — a 180° rotation around the X axis.' },
          { name: 'Z', color: '#ffd60a', desc: 'Phase flip. Leaves |0⟩ unchanged but flips the sign of |1⟩. Invisible alone, powerful in circuits.' },
          { name: 'CNOT', color: '#30d158', desc: 'Two-qubit gate. Flips target if control is |1⟩. The fundamental entangling gate.' },
        ],
      },
      {
        type: 'example',
        label: 'Simulator example',
        text: 'Apply H then Z then H in the Playground. The result is |1⟩ — Z flipped a hidden phase that H converted into a measurable outcome. This is quantum interference.',
        action: 'playground',
        actionLabel: 'Try in Playground →',
      },
    ],
  },
  {
    id: 'measurement',
    number: '03',
    title: 'Quantum Measurement',
    color: '#ff9f0a',
    summary: 'Observation collapses superposition into a definite outcome.',
    content: [
      {
        type: 'text',
        text: 'Quantum measurement is fundamentally different from classical measurement. Observing a quantum system forces it to choose a definite state — collapsing the superposition. The probability of each outcome is given by the Born rule.',
      },
      {
        type: 'equation',
        label: 'Born rule',
        eq: 'P(|i⟩) = |αᵢ|²',
        constraint: 'probability = amplitude squared',
      },
      {
        type: 'text',
        text: 'After measurement, the qubit is no longer in superposition — it is definitively in the measured state. This irreversibility is why measurement is placed at the end of every quantum circuit. Measuring mid-circuit destroys the quantum information.',
      },
      {
        type: 'insight',
        text: 'The probability chart in your simulator shows the Born rule probabilities before measurement — what you would observe if you ran the circuit many times and averaged the results.',
      },
      {
        type: 'example',
        label: 'Simulator example',
        text: 'Apply H to one qubit and run. The chart shows 50/50. This does not mean the qubit is simultaneously 0 and 1 after measurement — it means if you ran this circuit 1000 times, roughly 500 measurements would give 0 and 500 would give 1.',
        action: 'playground',
        actionLabel: 'Try in Playground →',
      },
    ],
  },
  {
    id: 'entanglement',
    number: '04',
    title: 'Entanglement',
    color: '#bf5af2',
    summary: 'Non-classical correlations between qubits.',
    content: [
      {
        type: 'text',
        text: 'Entanglement is a correlation between qubits that has no classical equivalent. When two qubits are entangled, measuring one instantly determines the state of the other — regardless of the distance between them. Einstein called this "spooky action at a distance."',
      },
      {
        type: 'equation',
        label: 'Bell state — maximally entangled',
        eq: '|Φ+⟩ = (|00⟩ + |11⟩) / √2',
        constraint: '50% chance of |00⟩, 50% chance of |11⟩ — never |01⟩ or |10⟩',
      },
      {
        type: 'text',
        text: 'The Bell state is created by applying H to qubit 0 then CNOT with qubit 0 as control and qubit 1 as target. The two qubits are now inseparable — you cannot describe qubit 0\'s state independently of qubit 1. This is what makes entanglement fundamentally non-classical.',
      },
      {
        type: 'insight',
        text: 'The Bloch sphere can only represent single qubit states. Entangled qubits have no individual Bloch sphere representation — their state only exists as a joint system. This is a mathematical proof that entanglement is non-classical.',
      },
      {
        type: 'example',
        label: 'Simulator example',
        text: 'Build the Bell state: H on qubit 0, CNOT control 0 target 1. The probability chart shows exactly 50% |00⟩ and 50% |11⟩ with 0% on |01⟩ and |10⟩. The qubits are perfectly correlated.',
        action: 'playground',
        actionLabel: 'Try in Playground →',
      },
    ],
  },
  {
    id: 'algorithms',
    number: '05',
    title: 'Quantum Algorithms',
    color: '#ff453a',
    summary: 'Harnessing interference for computational advantage.',
    content: [
      {
        type: 'text',
        text: 'Quantum algorithms exploit superposition, entanglement, and interference to solve specific problems faster than any classical algorithm. The key insight is that quantum amplitudes can cancel (destructive interference) or reinforce (constructive interference) — allowing algorithms to suppress wrong answers and amplify correct ones.',
      },
      {
        type: 'alglist',
        algorithms: [
          {
            name: 'Deutsch-Jozsa',
            speedup: 'Exponential',
            color: '#7c6aff',
            desc: 'Determines if a function is constant or balanced in 1 query. Classically requires 2 queries. Demonstrates that quantum computers can solve certain problems with certainty in fewer queries.',
            action: 'algorithms',
          },
          {
            name: "Grover's Search",
            speedup: 'Quadratic',
            color: '#30d158',
            desc: 'Finds a marked item in an unsorted list of N items in √N queries. Classically requires N/2 queries on average. Uses amplitude amplification to boost the target state probability.',
            action: 'algorithms',
          },
        ],
      },
      {
        type: 'insight',
        text: 'Both algorithms use the same core pattern: create superposition → encode the answer as phase → use interference to convert phase into measurable probability. This pattern generalises to Shor\'s factoring algorithm and quantum simulation.',
      },
    ],
  },
]

export default function Tutorials({ onNavigate }) {
  const [activeModule, setActiveModule] = useState('qubit')
  const [expandedGate, setExpandedGate] = useState(null)

  const module = MODULES.find(m => m.id === activeModule)

  function renderBlock(block, i) {
    switch (block.type) {

      case 'text':
        return (
          <p key={i} style={styles.bodyText}>
            {block.text}
          </p>
        )

      case 'equation':
        return (
          <div key={i} style={styles.equationBlock}>
            <div style={styles.equationLabel}>{block.label}</div>
            <div style={styles.equation}>{block.eq}</div>
            <div style={styles.equationConstraint}>{block.constraint}</div>
          </div>
        )

      case 'insight':
        return (
          <div key={i} style={{
            ...styles.insightBlock,
            borderColor: `${module.color}40`,
            background: `${module.color}08`,
          }}>
            <span style={{ ...styles.insightIcon, color: module.color }}>⚡</span>
            <p style={styles.insightText}>{block.text}</p>
          </div>
        )

      case 'example':
        return (
          <div key={i} style={styles.exampleBlock}>
            <div style={styles.exampleLabel}>{block.label}</div>
            <p style={styles.exampleText}>{block.text}</p>
            {block.action && onNavigate && (
              <button
                onClick={() => onNavigate(block.action)}
                style={{
                  ...styles.tryBtn,
                  borderColor: module.color,
                  color: module.color,
                }}
              >
                {block.actionLabel}
              </button>
            )}
          </div>
        )

      case 'gatelist':
        return (
          <div key={i} style={styles.gateList}>
            {block.gates.map((gate, j) => (
              <div
                key={j}
                onClick={() => setExpandedGate(expandedGate === gate.name ? null : gate.name)}
                style={{
                  ...styles.gateItem,
                  borderColor: expandedGate === gate.name ? gate.color : 'var(--border)',
                  background: expandedGate === gate.name ? `${gate.color}10` : 'var(--bg-card)',
                }}
              >
                <div style={styles.gateItemHeader}>
                  <span style={{ ...styles.gateChip, color: gate.color, borderColor: gate.color }}>
                    {gate.name}
                  </span>
                  <span style={styles.gateItemToggle}>
                    {expandedGate === gate.name ? '−' : '+'}
                  </span>
                </div>
                {expandedGate === gate.name && (
                  <p style={styles.gateItemDesc}>{gate.desc}</p>
                )}
              </div>
            ))}
          </div>
        )

      case 'alglist':
        return (
          <div key={i} style={styles.algList}>
            {block.algorithms.map((alg, j) => (
              <div key={j} style={{
                ...styles.algItem,
                borderColor: `${alg.color}40`,
                background: `${alg.color}06`,
              }}>
                <div style={styles.algItemHeader}>
                  <span style={{ ...styles.algName, color: alg.color }}>
                    {alg.name}
                  </span>
                  <span style={{
                    ...styles.speedupBadge,
                    color: alg.color,
                    borderColor: `${alg.color}50`,
                    background: `${alg.color}12`,
                  }}>
                    {alg.speedup} speedup
                  </span>
                </div>
                <p style={styles.algDesc}>{alg.desc}</p>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(alg.action)}
                    style={{
                      ...styles.tryBtn,
                      borderColor: alg.color,
                      color: alg.color,
                      marginTop: '8px',
                    }}
                  >
                    See it in Algorithms →
                  </button>
                )}
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={styles.container}>

      {/* ── Title ── */}
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Learn</h2>
        <p style={styles.subtitle}>
          Five concepts that form the foundation of quantum computing.
          Read, then try each idea in the simulator.
        </p>
      </div>

      <div style={styles.layout}>

        {/* ── Left — module list ── */}
        <div style={styles.sidebar}>
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              style={{
                ...styles.moduleBtn,
                borderColor: activeModule === m.id ? m.color : 'var(--border)',
                background: activeModule === m.id ? `${m.color}10` : 'transparent',
              }}
            >
              <span style={{
                ...styles.moduleNumber,
                color: activeModule === m.id ? m.color : 'var(--text-tertiary)',
              }}>
                {m.number}
              </span>
              <div style={styles.moduleBtnText}>
                <div style={{
                  ...styles.moduleBtnTitle,
                  color: activeModule === m.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                  {m.title}
                </div>
                <div style={styles.moduleBtnSummary}>{m.summary}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Right — module content ── */}
        <div style={styles.content} key={activeModule}>

          {/* Module header */}
          <div style={{
            ...styles.moduleHeader,
            borderColor: `${module.color}30`,
            background: `${module.color}06`,
          }}>
            <div style={{ ...styles.moduleHeaderNumber, color: module.color }}>
              {module.number}
            </div>
            <div>
              <h3 style={styles.moduleTitle}>{module.title}</h3>
              <p style={styles.moduleSummary}>{module.summary}</p>
            </div>
          </div>

          {/* Content blocks */}
          <div style={styles.blocks}>
            {module.content.map((block, i) => renderBlock(block, i))}
          </div>

        </div>

      </div>
    </div>
  )
}

const styles = {
  container:  { maxWidth: '1100px' },
  titleRow:   { marginBottom: '28px' },
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
    gridTemplateColumns: '260px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'sticky',
    top: '80px',
  },
  moduleBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  moduleNumber: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    flexShrink: 0,
    marginTop: '2px',
    letterSpacing: '0.05em',
  },
  moduleBtnText:    { display: 'flex', flexDirection: 'column', gap: '2px' },
  moduleBtnTitle: {
    fontSize: '13px', fontWeight: '600',
    fontFamily: 'var(--font-mono)',
    transition: 'color 0.15s ease',
  },
  moduleBtnSummary: {
    fontSize: '10px', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)', lineHeight: '1.4',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeSlideUp 0.25s ease forwards',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    padding: '20px 24px',
    borderRadius: '14px',
    border: '1px solid',
  },
  moduleHeaderNumber: {
    fontSize: '48px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    letterSpacing: '-0.04em',
    lineHeight: 1,
    flexShrink: 0,
    opacity: 0.6,
  },
  moduleTitle: {
    fontSize: '20px', fontWeight: '700',
    color: 'var(--text-primary)', marginBottom: '4px',
    fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
  },
  moduleSummary: {
    fontSize: '13px', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  blocks: { display: 'flex', flexDirection: 'column', gap: '16px' },
  bodyText: {
    fontSize: '14px', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)', lineHeight: '1.7',
  },
  equationBlock: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  equationLabel: {
    fontSize: '10px', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  equation: {
    fontSize: '20px', color: 'var(--accent)',
    fontFamily: 'var(--font-mono)', fontWeight: '400',
    letterSpacing: '0.02em',
  },
  equationConstraint: {
    fontSize: '11px', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  insightBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid',
  },
  insightIcon:  { fontSize: '16px', flexShrink: 0, marginTop: '1px' },
  insightText: {
    fontSize: '13px', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)', lineHeight: '1.6', margin: 0,
  },
  exampleBlock: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  exampleLabel: {
    fontSize: '10px', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  exampleText: {
    fontSize: '13px', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)', lineHeight: '1.6', margin: 0,
  },
  tryBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    transition: 'all 0.15s ease',
    alignSelf: 'flex-start',
    letterSpacing: '0.02em',
  },
  gateList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  gateItem: {
    borderRadius: '10px',
    border: '1px solid',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  gateItemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gateChip: {
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    padding: '2px 10px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'transparent',
  },
  gateItemToggle: {
    fontSize: '16px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  },
  gateItemDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
    margin: '10px 0 0 0',
  },
  algList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  algItem: {
    borderRadius: '12px',
    border: '1px solid',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  algItemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  algName: {
    fontSize: '15px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
  },
  speedupBadge: {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '20px',
    border: '1px solid',
    letterSpacing: '0.04em',
  },
  algDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
    margin: 0,
  },
}