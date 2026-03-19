code = '''import numpy as np

def get_single_qubit_gate(name):
    gates = {
        "I": np.array([[1, 0],[0, 1]], dtype=complex),
        "X": np.array([[0, 1],[1, 0]], dtype=complex),
        "Y": np.array([[0, -1j],[1j, 0]], dtype=complex),
        "Z": np.array([[1, 0],[0, -1]], dtype=complex),
        "H": np.array([[1, 1],[1, -1]], dtype=complex) / np.sqrt(2),
        "S": np.array([[1, 0],[0, 1j]], dtype=complex),
        "T": np.array([[1, 0],[0, np.exp(1j * np.pi / 4)]], dtype=complex),
    }
    if name not in gates:
        raise ValueError(f"Unknown gate: {name}")
    return gates[name]

def build_single_qubit_unitary(gate_name, target, n_qubits):
    I = get_single_qubit_gate("I")
    G = get_single_qubit_gate(gate_name)
    matrices = [G if i == target else I for i in range(n_qubits)]
    result = matrices[0]
    for m in matrices[1:]:
        result = np.kron(result, m)
    return result

def build_cnot_unitary(control, target, n_qubits):
    dim = 2 ** n_qubits
    unitary = np.eye(dim, dtype=complex)
    for state_index in range(dim):
        bits = list(format(state_index, f"0{n_qubits}b"))
        if bits[control] == "1":
            bits[target] = "0" if bits[target] == "1" else "1"
            new_index = int("".join(bits), 2)
            if new_index != state_index:
                unitary[:, [state_index, new_index]] = unitary[:, [new_index, state_index]]
    return unitary

def run_simulation(n_qubits, gates):
    dim = 2 ** n_qubits
    state = np.zeros(dim, dtype=complex)
    state[0] = 1.0
    for gate_def in gates:
        gate_name = gate_def["gate"]
        target = gate_def["target"]
        if gate_name == "CNOT":
            control = gate_def["control"]
            unitary = build_cnot_unitary(control, target, n_qubits)
        else:
            unitary = build_single_qubit_unitary(gate_name, target, n_qubits)
        state = unitary @ state
    probabilities = {}
    for i in range(dim):
        label = format(i, f"0{n_qubits}b")
        probabilities[label] = round(float(np.abs(state[i]) ** 2), 8)
    statevector = [{"real": round(float(a.real), 8), "imag": round(float(a.imag), 8)} for a in state]
    return {"n_qubits": n_qubits, "statevector": statevector, "probabilities": probabilities}
'''

with open("engine.py", "w") as f:
    f.write(code)

print("engine.py written successfully")