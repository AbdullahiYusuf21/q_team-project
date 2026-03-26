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