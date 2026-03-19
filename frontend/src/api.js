import axios from 'axios'

// All communication with the FastAPI backend lives here.
// Components never call axios directly — they call these functions.
// This means if your backend URL ever changes, you fix it in one place.

const BASE_URL = 'http://localhost:8000'

export async function simulateCircuit(nQubits, gates) {
  // gates should be an array like:
  // [{ gate: "H", target: 0 }, { gate: "CNOT", target: 1, control: 0 }]
  const response = await axios.post(`${BASE_URL}/simulate`, {
    n_qubits: nQubits,
    gates: gates
  })
  return response.data
  // returns { n_qubits, statevector, probabilities }
}