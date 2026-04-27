import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
import engine


def fidelity(sv1, sv2):
    return abs(np.dot(np.conj(sv1), sv2)) ** 2


def run_qiskit(n_qubits, gates):
    """
    The engine convention: qubit 0 = most significant bit.
    So index 2 = binary '10' means qubit 0 is |1>, qubit 1 is |0>.

    Qiskit convention: qubit 0 = least significant bit.
    So index 2 = binary '10' means qubit 1 is |1>, qubit 0 is |0>.

    These are exact opposites. To make Qiskit match our engine:
    - We do NOT reverse gate indices (let Qiskit use its own ordering)
    - We DO call reverse_qargs() to flip the output vector ordering
    
    This makes the statevector indices mean the same thing in both.
    """
    qc = QuantumCircuit(n_qubits)

    for g in gates:
        name   = g["gate"]
        target = g["target"]   # NO reversal — use as-is

        if name == "H":
            qc.h(target)
        elif name == "X":
            qc.x(target)
        elif name == "Y":
            qc.y(target)
        elif name == "Z":
            qc.z(target)
        elif name == "S":
            qc.s(target)
        elif name == "T":
            qc.t(target)
        elif name == "CNOT":
            qc.cx(g["control"], target)   # NO reversal

    sv = Statevector(qc)
    # reverse_qargs flips bit ordering so qubit 0 becomes most significant
    # making Qiskit's vector indices match our engine's indices exactly
    return np.array(sv.reverse_qargs().data)


def validate(label, n_qubits, gates):
    result    = engine.run_simulation(n_qubits, gates)
    your_sv   = np.array([complex(a["real"], a["imag"]) for a in result["statevector"]])
    qiskit_sv = run_qiskit(n_qubits, gates)

    f      = fidelity(your_sv, qiskit_sv)
    passed = f >= 0.9999

    print(f"{'✓ PASS' if passed else '✗ FAIL'}  {label}")
    print(f"       Fidelity: {f:.10f}")
    if not passed:
        print(f"       Your engine : {your_sv}")
        print(f"       Qiskit       : {qiskit_sv}")
    print()


if __name__ == "__main__":
    print("=" * 50)
    print("  Quantum Engine Validation vs Qiskit")
    print("=" * 50)
    print()

    validate("Pauli-X on |0>",
        n_qubits=1, gates=[{"gate": "X", "target": 0}])

    validate("Hadamard on |0>",
        n_qubits=1, gates=[{"gate": "H", "target": 0}])

    validate("Pauli-Z on |+>",
        n_qubits=1, gates=[{"gate": "H", "target": 0},
                            {"gate": "Z", "target": 0}])

    validate("H then X",
        n_qubits=1, gates=[{"gate": "H", "target": 0},
                            {"gate": "X", "target": 0}])

    validate("H on qubit 0, identity on qubit 1",
        n_qubits=2, gates=[{"gate": "H", "target": 0}])

    validate("H on qubit 1, identity on qubit 0",
        n_qubits=2, gates=[{"gate": "H", "target": 1}])

    validate("CNOT with |10> input",
        n_qubits=2, gates=[{"gate": "X",    "target": 0},
                            {"gate": "CNOT", "target": 1, "control": 0}])

    validate("Bell State",
        n_qubits=2, gates=[{"gate": "H",    "target": 0},
                            {"gate": "CNOT", "target": 1, "control": 0}])

    validate("GHZ State",
        n_qubits=3, gates=[{"gate": "H",    "target": 0},
                            {"gate": "CNOT", "target": 1, "control": 0},
                            {"gate": "CNOT", "target": 2, "control": 0}])