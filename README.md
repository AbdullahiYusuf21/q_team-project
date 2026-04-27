# QSIM — Web-Based Quantum Circuit Simulator & Visualizer

> A full-stack interactive quantum computing educational platform.

**Live Application:** https://q-team-project.vercel.app  
**Backend API:** https://qsim-api.onrender.com  
**Repository:** https://github.com/AbdullahiYusuf21/q_team-project

---

## Overview

QSIM is a browser-accessible quantum circuit simulator that makes quantum computing concepts tangible through interactive visualization. It combines a custom-built quantum simulation engine — validated against Qiskit at fidelity ≥ 0.9999 — with a modern React frontend featuring four educational tabs: Playground, Algorithms, Entanglement, and Learn.

The platform targets undergraduate learners who struggle with the abstract mathematical nature of quantum computing. Rather than replacing theoretical study, QSIM provides an interactive layer that bridges the gap between equations and intuition.

---

## Features

### Playground Tab
- Interactive circuit grid — click to place gates across 1–5 qubits and 8 time steps
- 7 quantum gates: H, X, Y, Z, S, T, CNOT with colour-coded tooltips
- CNOT visual connection lines linking control and target qubits
- Step-through mode — apply one gate at a time and watch the quantum state evolve
- 5 preset circuits — Bell State, GHZ State, Full Superposition, Phase Kickback, Teleportation Prep
- Statevector display — full complex amplitudes after simulation
- Measurement collapse — simulates Born rule wavefunction collapse with animation
- D3.js probability histogram
- Qiskit Python export — download the current circuit as a runnable Python script

### Algorithms Tab
- **Deutsch-Jozsa** — three oracle types (Constant 0, Constant 1, Balanced) with circuit diagram and 5-step educational walkthrough
- **Grover's Search** — search any of 4 target states with amplitude amplification demonstration
- Verdict banners confirming quantum advantage over classical approaches
- Step-by-step explanation pills for each algorithm stage

### Entanglement Tab
- Interactive 3D Bloch sphere (Three.js) — drag to rotate
- Apply gates and watch the state vector move in real time
- Applied gate sequence display
- Measurement probability readout
- Educational note on why entangled states cannot be represented on individual Bloch spheres

### Learn Tab
- 5 concept modules: Qubit, Quantum Gates, Measurement, Entanglement, Quantum Algorithms
- Equations in monospace notation
- Expandable gate cards and algorithm cards
- "Try it" buttons that navigate directly to the relevant simulator tab

### Design
- Dark/light mode toggle
- Quantum-themed animated SVG background — probability waves, entanglement rings, rotating triangles
- Monospace typography system-wide
- Frosted glass navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, D3.js, Three.js |
| Backend | Python, FastAPI, NumPy |
| Validation | Qiskit |
| Deployment | Vercel (frontend), Render (backend) |
| Version Control | GitHub |

---

## Project Structure

```
q_team-project/
├── backend/
│   ├── engine.py          # Custom quantum simulation engine
│   ├── main.py            # FastAPI endpoints
│   ├── validate.py        # Qiskit cross-validation script
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js
        ├── index.css
        └── components/
            ├── CircuitBuilder.jsx
            ├── AlgorithmPanel.jsx
            ├── BlochSphere.jsx
            ├── Tutorials.jsx
            ├── ProbabilityChart.jsx
            ├── ExportButton.jsx
            └── GateToolbar.jsx
```

---

## Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/AbdullahiYusuf21/q_team-project.git
cd q_team-project/backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
Interactive API docs at: `http://localhost:8000/docs`

### Frontend Setup

```bash
# In a new terminal
cd q_team-project/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Reference

### `POST /simulate`
General quantum circuit simulation.

**Request:**
```json
{
  "n_qubits": 2,
  "gates": [
    { "gate": "H", "target": 0 },
    { "gate": "CNOT", "control": 0, "target": 1 }
  ]
}
```

**Response:**
```json
{
  "n_qubits": 2,
  "statevector": [
    { "real": 0.70710678, "imag": 0.0 },
    { "real": 0.0,        "imag": 0.0 },
    { "real": 0.0,        "imag": 0.0 },
    { "real": 0.70710678, "imag": 0.0 }
  ],
  "probabilities": {
    "00": 0.5,
    "01": 0.0,
    "10": 0.0,
    "11": 0.5
  }
}
```

### `POST /deutsch-jozsa`
Runs the Deutsch-Jozsa algorithm.

**Request:**
```json
{ "oracle_type": "balanced" }
```

Valid `oracle_type` values: `"constant_0"`, `"constant_1"`, `"balanced"`

### `POST /grover`
Runs Grover's search algorithm on a 2-qubit system.

**Request:**
```json
{ "target": "11" }
```

Valid `target` values: `"00"`, `"01"`, `"10"`, `"11"`

### `POST /bloch`
Returns Bloch sphere coordinates for a single-qubit state.

**Request:**
```json
{
  "gates": [
    { "gate": "H", "target": 0 }
  ]
}
```

**Response:**
```json
{
  "x": 1.0,
  "y": 0.0,
  "z": 0.0,
  "theta": 1.5707963,
  "phi": 0.0,
  "label": "|+⟩",
  "probabilities": { "0": 0.5, "1": 0.5 }
}
```

---

## Quantum Engine Validation

The custom engine in `engine.py` is validated against IBM Qiskit using quantum state fidelity:

```
F = |⟨ψ_custom|ψ_qiskit⟩|²
```

All 9 test cases pass at fidelity ≥ 0.9999:

| Test Case | Fidelity |
|---|---|
| Pauli-X on \|0⟩ | 1.0000000000 |
| Hadamard on \|0⟩ | 0.9999999966 |
| Pauli-Z on \|+⟩ | 0.9999999966 |
| H then X | 0.9999999966 |
| H on qubit 0 (2-qubit) | 0.9999999966 |
| H on qubit 1 (2-qubit) | 0.9999999966 |
| CNOT with \|10⟩ input | 1.0000000000 |
| Bell State \|Φ+⟩ | 0.9999999966 |
| GHZ State (3-qubit) | 0.9999999966 |

Run validation locally:

```bash
cd backend
python validate.py
```

---

## Supported Gates

| Gate | Matrix | Description |
|---|---|---|
| H | (1/√2)[[1,1],[1,-1]] | Hadamard — creates superposition |
| X | [[0,1],[1,0]] | Pauli-X — quantum NOT gate |
| Y | [[0,-i],[i,0]] | Pauli-Y — bit and phase flip |
| Z | [[1,0],[0,-1]] | Pauli-Z — phase flip |
| S | [[1,0],[0,i]] | S Gate — 90° phase rotation |
| T | [[1,0],[0,e^(iπ/4)]] | T Gate — 45° phase rotation |
| CNOT | 4×4 controlled-X | Entangling gate |

---

## Deployment

### Frontend — Vercel
The frontend auto-deploys from the `master` branch on every push.

Environment variable required:
```
VITE_API_URL=https://qsim-api.onrender.com
```

### Backend — Render
The backend runs as a Render web service.

Start command:
```
uvicorn main:app --host 0.0.0.0 --port 10000
```

**Note:** The free Render tier spins down after 15 minutes of inactivity. The first request after an idle period may take 30–60 seconds to respond.

---

## Academic Context

This project was developed as a final year thesis for the Bachelor of Science in Applied Physics and Computer Science at Multimedia University of Kenya (2021–2026).

**Thesis title:** A Web-Based Interactive Quantum Computing Simulator and Visualizer  
**Student:** Haron Abdullahi Yusuf  
**Registration:** SCT-253-018/2021  


### Key Design Decisions

- **Custom engine over Qiskit wrapper** — building `engine.py` from scratch using NumPy ensures every line is understood and explainable, which is central to the thesis's educational and academic integrity objectives.
- **State-vector simulation** — chosen over density matrix or stabilizer approaches for its clarity and suitability for visualization.
- **Qiskit for validation only** — used exclusively in `validate.py` to cross-check correctness; never runs in the production application.
- **Qubit ordering convention** — qubit 0 is the most significant bit throughout the engine, consistent with standard textbook notation.

---

## License

MIT License — free for educational use and research.

---

## References

- Nielsen, M. A., & Chuang, I. L. (2010). *Quantum Computation and Quantum Information*. Cambridge University Press.
- Deutsch, D., & Jozsa, R. (1992). Rapid solution of problems by quantum computation. *Proceedings of the Royal Society of London*, 439, 553–558.
- Grover, L. K. (1996). A fast quantum mechanical algorithm for database search. *Proceedings, 28th Annual ACM Symposium on the Theory of Computing*, 212–219.
- IBM Quantum. (2023). Qiskit Documentation. https://qiskit.org
