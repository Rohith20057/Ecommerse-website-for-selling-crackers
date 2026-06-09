# 🎇 Crackers For You - Full Stack E-Commerce & Quantum-Safe Communication Hub

Welcome to **Crackers For You**, a premium full-stack e-commerce platform for purchasing high-quality green festival crackers at affordable rates, integrated with a state-of-the-art **Quantum Key Distribution (QKD) Secure Communication Hub**.

## 🚀 Key Highlights & Tech Stack

*   **Frontend**: Next.js (App Router), React.js, TailwindCSS, TypeScript, Lucide Icons, Shadcn UI
*   **Backend**: FastAPI, Python 3.10+ (modular service structure), Uvicorn
*   **Database**: MySQL (complex transactional logic & joins) & MongoDB (catalog storage)
*   **Security Core**: BB84 Protocol Simulator for Quantum-Safe One-Time Pad encrypted chat

---

## 🔒 Quantum-Safe Encrypted Communication (QKD BB84)

Future quantum computers pose a threat to standard asymmetric encryption (like RSA/ECC). To address this, we engineered a client-server simulated **Quantum Key Distribution (QKD)** channel inside the website using the **BB84 (Bennett-Brassard 1984)** protocol to establish mathematically unbreakable communication between the seller (**Uday Kiran Naik**) and the customer:

### How it Works:
1.  **Qubit Preparation**: The client (Alice/Customer) prepares random polarization qubits (vertical, horizontal, diagonal) representing raw bits.
2.  **Quantum Transmission**: The qubits are sent over the simulated quantum fiber channel.
3.  **Measurement**: The FastAPI server (Bob/Seller) measures qubits using random measurement bases (`+` and `x`).
4.  **Sifting**: Alice and Bob publicly discuss which bases were matched, discarding mismatched bases.
5.  **Error Estimation (Eavesdropper Detection)**: A subset of key bits is compared. If the **Quantum Bit Error Rate (QBER)** is $\ge 11\%$, eavesdropping (Eve) is detected, the key is aborted, and alerts trigger. If QBER $< 11\%$, the remaining bits are distilled into a **256-bit symmetric One-Time Pad key**.
6.  **Secure Encrypted Chat**: Once the key is distilled, the chat portal unlocks, allowing XOR-encrypted messaging.

---

## 🛠️ Project Structure

```text
├── backend/                       # Python FastAPI Backend
│   ├── main.py                    # API entry point & BB84 QKD protocol endpoints
│   └── requirements.txt           # Python backend dependencies
└── crackers-ecommerce/            # Next.js React Frontend
    ├── app/                       # Next.js App Router paths
    │   ├── secure-chat/           # BB84 Simulator and Chat interface
    │   ├── contact/               # Contact page with QKD promo card
    │   ├── cart/                  # Cart manager
    │   └── page.tsx               # Main store layout
    ├── components/                # Reusable React components & Shadcn UI
    └── lib/                       # Helpers & data types
```

---

## ⚡ Getting Started

### 1. Launching the Backend (FastAPI)
Navigate to the `backend` directory, install dependencies, and run Uvicorn:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The FastAPI documentation will be available at `http://localhost:8000/docs`.

### 2. Launching the Frontend (Next.js)
Navigate to the `crackers-ecommerce` directory, install dependencies, and run the dev server:
```bash
cd crackers-ecommerce
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. The frontend will automatically detect the FastAPI server on port 8000 and connect. If the backend is offline, the frontend will automatically fall back to its internal High-Fidelity Local Quantum Emulator so all features stay fully interactive!
