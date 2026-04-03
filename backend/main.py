from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import engine

app = FastAPI(title="Quantum Simulator API")

# ─────────────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# Your React frontend runs on port 5173. Your backend runs on 8000.
# Browsers block cross-port requests by default (security policy).
# This middleware tells the browser: "it's okay, I allow this."
# Without it, your frontend will get a CORS error on every request.
# ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────
# REQUEST MODELS
# Pydantic models define the expected shape of incoming JSON.
# FastAPI validates every request against these automatically.
# If the frontend sends a missing field or wrong type, FastAPI
# rejects it with a clear error before it touches your engine.
# ─────────────────────────────────────────────────────────────────
class GateInstruction(BaseModel):
    gate: str           # e.g. "H", "X", "CNOT"
    target: int         # which qubit this gate acts on
    control: Optional[int] = None  # only used for CNOT


class SimulateRequest(BaseModel):
    n_qubits: int
    gates: List[GateInstruction]


# ─────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Quantum Simulator API is running"}


@app.post("/simulate")
def simulate(request: SimulateRequest):
    if not (1 <= request.n_qubits <= 8):
        raise HTTPException(
            status_code=400,
            detail="n_qubits must be between 1 and 8"
        )

    gate_list = [g.dict() for g in request.gates]

    try:
        result = engine.run_simulation(request.n_qubits, gate_list)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result
class DeutschJozsaRequest(BaseModel):
    oracle_type: str  # "constant_0", "constant_1", or "balanced"

@app.post("/deutsch-jozsa")
def run_deutsch_jozsa(request: DeutschJozsaRequest):
    valid = ["constant_0", "constant_1", "balanced"]
    if request.oracle_type not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"oracle_type must be one of {valid}"
        )
    try:
        result = engine.deutsch_jozsa(request.oracle_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result
class GroverRequest(BaseModel):
    target: str  # "00", "01", "10", or "11"

@app.post("/grover")
def run_grover(request: GroverRequest):
    valid = ["00", "01", "10", "11"]
    if request.target not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"target must be one of {valid}"
        )
    try:
        result = engine.grover_search(request.target)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result
class BlochRequest(BaseModel):
    gates: List[GateInstruction]

@app.post("/bloch")
def get_bloch_state(request: BlochRequest):
    """
    Simulates a single qubit circuit and returns the
    Bloch sphere coordinates for the resulting state.
    
    Converts state vector amplitudes to spherical coordinates:
    θ = 2 * arccos(|α|)
    φ = arg(β) - arg(α)
    Then to Cartesian: x = sin(θ)cos(φ), y = sin(θ)sin(φ), z = cos(θ)
    """
    gate_list = [g.dict() for g in request.gates]

    try:
        result = engine.run_simulation(1, gate_list)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Extract complex amplitudes from statevector
    sv = result["statevector"]
    alpha = complex(sv[0]["real"], sv[0]["imag"])  # |0⟩ amplitude
    beta  = complex(sv[1]["real"], sv[1]["imag"])  # |1⟩ amplitude

    import numpy as np
    import cmath

    # Convert to Bloch sphere spherical coordinates
    theta = 2 * np.arccos(min(abs(alpha), 1.0))
    phi   = (cmath.phase(beta) - cmath.phase(alpha)) if abs(beta) > 1e-10 else 0.0

    # Convert to Cartesian coordinates
    x = float(np.sin(theta) * np.cos(phi))
    y = float(np.sin(theta) * np.sin(phi))
    z = float(np.cos(theta))

    # Determine state label
    def get_state_label(x, y, z):
        if   z >  0.99: return "|0⟩"
        elif z < -0.99: return "|1⟩"
        elif abs(x - 1) < 0.01: return "|+⟩"
        elif abs(x + 1) < 0.01: return "|−⟩"
        elif abs(y - 1) < 0.01: return "|i⟩"
        elif abs(y + 1) < 0.01: return "|-i⟩"
        else: return "|ψ⟩"

    return {
        "x": x, "y": y, "z": z,
        "theta": float(theta),
        "phi":   float(phi),
        "label": get_state_label(x, y, z),
        "probabilities": result["probabilities"]
    }