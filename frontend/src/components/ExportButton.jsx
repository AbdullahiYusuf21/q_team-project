// Converts the current grid into a Qiskit Python script and downloads it.
// This is pure string templating — no backend call needed.
// It's one of the most educationally valuable features:
// students can copy the exported code into a Jupyter notebook
// and verify results themselves.

export default function ExportButton({ grid, nQubits }) {

  function handleExport() {
    const lines = [
      'from qiskit import QuantumCircuit',
      'from qiskit.quantum_info import Statevector',
      '',
      `qc = QuantumCircuit(${nQubits})`,
      '',
    ]

    const STEPS = grid[0].length

    for (let step = 0; step < STEPS; step++) {
      for (let qubit = 0; qubit < nQubits; qubit++) {
        const cell = grid[qubit][step]
        if (!cell) continue
        const qiskitQubit = (nQubits - 1) - qubit  // Qiskit uses reversed ordering
        if (cell.gate === 'CNOT' && cell.role === 'control') {
          const qiskitTarget = (nQubits - 1) - cell.linkedQubit
          lines.push(`qc.cx(${qiskitQubit}, ${qiskitTarget})`)
        } else if (cell.gate !== 'CNOT') {
          lines.push(`qc.${cell.gate.toLowerCase()}(${qiskitQubit})`)
        }
      }
    }

    lines.push('')
    lines.push('sv = Statevector(qc)')
    lines.push('print(sv.probabilities_dict())')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'circuit.py'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport} style={styles.btn}>
      ↓ Export as Qiskit Python
    </button>
  )
}

const styles = {
  btn: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: '1px solid var(--accent)',
    background: 'transparent',
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '13px',
    marginBottom: '20px',
  }
}