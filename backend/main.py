import uuid
import random
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Quantum-Safe E-Commerce Secure Communication API",
    description="A FastAPI backend implementing simulated BB84 Quantum Key Distribution (QKD) and secure messaging.",
    version="1.0.0"
)

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active QKD sessions
# In a real system, this would be a secure cache like Redis
sessions: Dict[str, dict] = {}

class InitiateRequest(BaseModel):
    session_id: Optional[str] = None
    client_bits: List[int]
    client_bases: List[str]

class InitiateResponse(BaseModel):
    session_id: str
    message: str

class MeasureRequest(BaseModel):
    session_id: str
    simulate_eve: bool

class MeasureResponse(BaseModel):
    bob_bases: List[str]
    bob_measured_bits: List[int]  # Exposed for visual/educational purposes in the simulation

class SiftRequest(BaseModel):
    session_id: str
    matching_indices: List[int]

class SiftResponse(BaseModel):
    message: str
    sifted_length: int

class VerifyRequest(BaseModel):
    session_id: str
    verification_indices: List[int]

class VerifyResponse(BaseModel):
    qber: float
    secure: bool
    shared_key_hex: Optional[str] = None
    message: str

class ChatMessage(BaseModel):
    session_id: str
    encrypted_message_hex: str

class ChatResponse(BaseModel):
    encrypted_response_hex: str
    decrypted_message: str
    plain_response: str


def xor_encrypt_decrypt(text: str, key_hex: str) -> str:
    """Simple XOR One-Time Pad encryption/decryption for demonstration."""
    key_bytes = bytes.fromhex(key_hex)
    if not key_bytes:
        return text
    
    text_bytes = text.encode('utf-8')
    cipher_bytes = bytearray()
    
    for i, b in enumerate(text_bytes):
        # Cycle through key bytes if the key is shorter than the text
        key_byte = key_bytes[i % len(key_bytes)]
        cipher_bytes.append(b ^ key_byte)
        
    return cipher_bytes.hex()

def xor_hex_to_string(hex_str: str, key_hex: str) -> str:
    """Decrypts XOR encrypted hex string back to UTF-8 text."""
    try:
        cipher_bytes = bytes.fromhex(hex_str)
        key_bytes = bytes.fromhex(key_hex)
        if not key_bytes:
            return ""
            
        plain_bytes = bytearray()
        for i, b in enumerate(cipher_bytes):
            key_byte = key_bytes[i % len(key_bytes)]
            plain_bytes.append(b ^ key_byte)
            
        return plain_bytes.decode('utf-8', errors='replace')
    except Exception:
        return "[Decryption Error]"


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Quantum Secure Communication Backend",
        "author": "Uday Kiran Naik"
    }

@app.post("/api/qkd/initiate", response_model=InitiateResponse)
def initiate_qkd(req: InitiateRequest):
    session_id = req.session_id or str(uuid.uuid4())
    
    if len(req.client_bits) != len(req.client_bases):
        raise HTTPException(status_code=400, detail="client_bits and client_bases must have the same length")
        
    sessions[session_id] = {
        "client_bits": req.client_bits,
        "client_bases": req.client_bases,
        "bob_bases": [],
        "bob_measured_bits": [],
        "alice_sifted_bits": [],
        "bob_sifted_bits": [],
        "shared_key_hex": None,
        "secure": False
    }
    
    return InitiateResponse(
        session_id=session_id,
        message="Quantum session initialized. Qubits received in transit."
    )

@app.post("/api/qkd/measure", response_model=MeasureResponse)
def measure_qkd(req: MeasureRequest):
    session_id = req.session_id
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = sessions[session_id]
    client_bits = session["client_bits"]
    client_bases = session["client_bases"]
    
    n = len(client_bits)
    bob_bases = []
    bob_measured_bits = []
    
    for i in range(n):
        # Bob chooses a random basis (+ or x)
        b_basis = random.choice(["+", "x"])
        bob_bases.append(b_basis)
        
        a_bit = client_bits[i]
        a_basis = client_bases[i]
        
        # Simulate Eavesdropper (Eve)
        if req.simulate_eve:
            # Eve measures the qubit in a random basis
            eve_basis = random.choice(["+", "x"])
            if eve_basis == a_basis:
                # Eve measures correctly, doesn't change the state polarization
                eve_measured_bit = a_bit
            else:
                # Eve measures in wrong basis, collapses state, measures random bit
                eve_measured_bit = random.choice([0, 1])
                # The state is now polarized in Eve's basis
                a_bit = eve_measured_bit
                a_basis = eve_basis
        
        # Bob measures the (possibly altered) qubit
        if b_basis == a_basis:
            bob_measured_bits.append(a_bit)
        else:
            # Bases do not match, Bob measures 0 or 1 with 50% probability
            bob_measured_bits.append(random.choice([0, 1]))
            
    session["bob_bases"] = bob_bases
    session["bob_measured_bits"] = bob_measured_bits
    
    return MeasureResponse(
        bob_bases=bob_bases,
        bob_measured_bits=bob_measured_bits
    )

@app.post("/api/qkd/sift", response_model=SiftResponse)
def sift_qkd(req: SiftRequest):
    session_id = req.session_id
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = sessions[session_id]
    client_bits = session["client_bits"]
    bob_measured_bits = session["bob_measured_bits"]
    
    alice_sifted = []
    bob_sifted = []
    
    for idx in req.matching_indices:
        if idx < len(client_bits) and idx < len(bob_measured_bits):
            alice_sifted.append(client_bits[idx])
            bob_sifted.append(bob_measured_bits[idx])
            
    session["alice_sifted_bits"] = alice_sifted
    session["bob_sifted_bits"] = bob_sifted
    
    return SiftResponse(
        message="Bases compared. Mismatched bases discarded.",
        sifted_length=len(alice_sifted)
    )

@app.post("/api/qkd/verify", response_model=VerifyResponse)
def verify_qkd(req: VerifyRequest):
    session_id = req.session_id
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = sessions[session_id]
    alice_sifted = session["alice_sifted_bits"]
    bob_sifted = session["bob_sifted_bits"]
    
    if not alice_sifted or not bob_sifted:
        raise HTTPException(status_code=400, detail="Must sift key before verification")
        
    errors = 0
    total_verify = len(req.verification_indices)
    
    if total_verify == 0:
        raise HTTPException(status_code=400, detail="Verification indices cannot be empty")
        
    for idx in req.verification_indices:
        if idx < len(alice_sifted) and idx < len(bob_sifted):
            if alice_sifted[idx] != bob_sifted[idx]:
                errors += 1
                
    qber = errors / total_verify if total_verify > 0 else 0.0
    
    # 11% is the theoretical upper limit for security in BB84 (Shor-Preskill)
    if qber < 0.11:
        # Key is secure. Distill the key by removing the indices used for verification
        verify_set = set(req.verification_indices)
        alice_key_bits = [alice_sifted[i] for i in range(len(alice_sifted)) if i not in verify_set]
        bob_key_bits = [bob_sifted[i] for i in range(len(bob_sifted)) if i not in verify_set]
        
        # Convert the bits to hex string to create a usable AES/OTP key
        # We group bits into bytes
        key_bytes = bytearray()
        for i in range(0, len(bob_key_bits), 8):
            byte_bits = bob_key_bits[i:i+8]
            if not byte_bits:
                break
            # Pad byte if it is short
            while len(byte_bits) < 8:
                byte_bits.append(0)
            byte_val = 0
            for bit in byte_bits:
                byte_val = (byte_val << 1) | bit
            key_bytes.append(byte_val)
            
        shared_key_hex = key_bytes.hex()
        
        # Ensure key is not empty
        if not shared_key_hex:
            # Fallback key if too short
            shared_key_hex = "2e9a3f7b8c1d5e6f0a4b8c9d0e1f2a3b"
            
        session["shared_key_hex"] = shared_key_hex
        session["secure"] = True
        
        return VerifyResponse(
            qber=qber,
            secure=True,
            shared_key_hex=shared_key_hex,
            message="Secure quantum channel established. Shared key distilled successfully."
        )
    else:
        # Security compromised
        session["secure"] = False
        session["shared_key_hex"] = None
        return VerifyResponse(
            qber=qber,
            secure=False,
            message=f"Eavesdropping detected! QBER is {qber:.2%} (Limit is 11.00%). Quantum channel aborted."
        )

@app.post("/api/chat/send", response_model=ChatResponse)
def send_message(req: ChatMessage):
    session_id = req.session_id
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = sessions[session_id]
    if not session["secure"] or not session["shared_key_hex"]:
        raise HTTPException(status_code=403, detail="Secure quantum channel not established")
        
    shared_key_hex = session["shared_key_hex"]
    
    # Decrypt client's message
    decrypted_msg = xor_hex_to_string(req.encrypted_message_hex, shared_key_hex)
    
    # Generate automatic response based on contents
    msg_lower = decrypted_msg.lower()
    if "price" in msg_lower or "cost" in msg_lower or "discount" in msg_lower:
        response_text = "Greetings from Uday Kiran Naik! For bulk purchases of crackers, we offer up to 40% discount on Sivakasi brand crackers. Your order price will be updated securely in your cart."
    elif "delivery" in msg_lower or "shipping" in msg_lower or "track" in msg_lower:
        response_text = "Hello! We ship our crackers in heavy-duty moisture-proof packaging. Standard delivery takes 2-3 business days. We will dispatch your tracking number via this quantum-secured link once shipped."
    elif "safety" in msg_lower or "green" in msg_lower or "eco" in msg_lower:
        response_text = "Safety is our number one concern! All our sparklers, flower pots, and ground chakkars are certified green crackers with low emission rates and chemical safety tags."
    else:
        response_text = f"Thank you for contacting us securely! We have received your message: '{decrypted_msg}'. A representative will contact you soon on this quantum-safe chat line."
        
    # Encrypt the response
    encrypted_response_hex = xor_encrypt_decrypt(response_text, shared_key_hex)
    
    return ChatResponse(
        encrypted_response_hex=encrypted_response_hex,
        decrypted_message=decrypted_msg,
        plain_response=response_text
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
