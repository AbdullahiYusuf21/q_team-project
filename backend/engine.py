import numpy as np

# ═══════════════════════════════════════════════════════════════════
# CONVENTION USED THROUGHOUT THIS FILE
#
# State vector index → binary string → qubit values
#   index 0 = "00" → qubit 0 = 0, qubit 1 = 0
#   index 1 = "01" → qubit 0 = 0, qubit 1 = 1
#   index 2 = "10" → qubit 0 = 1, qubit 1 = 0
#   index 3 = "11" → qubit 0 = 1, qubit 1 = 1
#
# Qubit 0 is the MOST significant bit (leftmost in binary string).
# This means in format(index, '02b'), qubit k is at position k.
#
# np.kron(A, B) puts A as the more significant (left) operand,
# so for qubit 0 to be most significant we tensor left to right:
#   qubit 0 gate ⊗ qubit 1 gate ⊗ qubit 2 gate ...
# ═══════════════════════════════════════════════════════════════════


# ─────────────────────────────────────────────────────────────────
# BLOCK 1: GATE LIBRARY
# ─────────────────────────────────────────────────────────────────

def get_single_qubit_gate(name: str) -> np.ndarray:
    gates = {
        "I": np.array([[1, 0],
                       [0, 1]], dtype=complex),

        "X": np.array([[0, 1],
                       [1, 0]], dtype=complex),

        "Y": np.array([[0, -1j],
                       [1j,  0]], dtype=complex),

        "Z": np.array([[1,  0],
                       [0, -1]], dtype=complex),

        "H": np.array([[1,  1],
                       [1, -1]], dtype=complex) / np.sqrt(2),

        "S": np.array([[1, 0],
                       [0, 1j]], dtype=complex),

        "T": np.array([[1, 0],
                       [0, np.exp(1j * np.pi / 4)]], dtype=complex),
    }
    if name not in gates:
        raise ValueError(f"Unknown gate: '{name}'")
    return gates[name]


# ─────────────────────────────────────────────────────────────────
# BLOCK 2: SINGLE-QUBIT GATE EXPANSION
#
# Qubit 0 is most significant, so tensoring left to right means:
#   position 0 in the list → most significant → qubit 0
#   position 1 in the list → next             → qubit 1
# etc.
# This matches format(index, f'0{n}b')[k] == qubit k's value.
# ─────────────────────────────────────────────────────────────────

def build_single_qubit_unitary(gate_name: str, target: int, n_qubits: int) -> np.ndarray:
    I = get_single_qubit_gate("I")
    G = get_single_qubit_gate(gate_name)

    # Place G at position `target`, identity everywhere else
    # Tensor left to right: qubit 0 is leftmost = most significant
    matrices = [G if i == target else I for i in range(n_qubits)]

    result = matrices[0]
    for m in matrices[1:]:
        result = np.kron(result, m)

    return result


# ─────────────────────────────────────────────────────────────────
# BLOCK 3: CNOT GATE
#
# Under our convention, format(state_index, f'0{n}b')[k] gives
# the value of qubit k directly — no reversal needed.
# qubit 0 = bits[0] (leftmost, most significant bit).
# ─────────────────────────────────────────────────────────────────

def build_cnot_unitary(control, target, n_qubits):
    dim = 2 ** n_qubits
    unitary = np.eye(dim, dtype=complex)
    already_swapped = set()

    for state_index in range(dim):
        bits = list(format(state_index, f"0{n_qubits}b"))

        if bits[control] == "1":
            bits[target] = "0" if bits[target] == "1" else "1"
            new_index = int("".join(bits), 2)

            # Only swap if we haven't processed this pair yet.
            # Without this guard, when we reach state_index=3 after
            # already swapping columns 2 and 3, we swap them back —
            # perfectly undoing the first swap and leaving the identity.
            pair = (min(state_index, new_index), max(state_index, new_index))
            if pair not in already_swapped:
                unitary[:, [state_index, new_index]] = unitary[:, [new_index, state_index]]
                already_swapped.add(pair)

    return unitary

# ─────────────────────────────────────────────────────────────────
# BLOCK 4: SIMULATION RUNNER
# ─────────────────────────────────────────────────────────────────

def run_simulation(n_qubits: int, gates: list) -> dict:
    dim = 2 ** n_qubits
    state = np.zeros(dim, dtype=complex)
    state[0] = 1.0  # |00...0⟩

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
        label = format(i, f'0{n_qubits}b')
        probabilities[label] = round(float(np.abs(state[i]) ** 2), 8)

    statevector = [
        {"real": round(float(a.real), 8), "imag": round(float(a.imag), 8)}
        for a in state
    ]

    return {
        "n_qubits": n_qubits,
        "statevector": statevector,
        "probabilities": probabilities
    }