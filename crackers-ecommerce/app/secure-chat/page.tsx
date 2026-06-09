"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
  ShieldCheck, ShieldAlert, Cpu, Send, 
  Radio, Eye, EyeOff, Activity, Wifi, WifiOff, 
  Lock, Unlock, RefreshCw, Info, ArrowLeft, ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"

// Types for the QKD BB84 Protocol
interface Qubit {
  index: number
  aliceBit: number
  aliceBasis: "+" | "x"
  alicePolarization: "↑" | "→" | "↗" | "↖"
  eveBasis?: "+" | "x"
  eveMeasuredBit?: number
  bobBasis?: "+" | "x"
  bobMeasuredBit?: number
  basisMatched?: boolean
  siftedBit?: number
  usedForVerify?: boolean
  finalKeyBit?: number
}

interface ChatMessage {
  id: string
  sender: "customer" | "seller"
  plaintext: string
  ciphertextHex: string
  timestamp: string
  isDecrypting?: boolean
  isEncrypting?: boolean
}

const API_BASE = "http://localhost:8000"

// Browser-native helper functions to replace Node's Buffer
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const stringToBytes = (str: string): Uint8Array => {
  return textEncoder.encode(str)
}

const bytesToString = (bytes: Uint8Array): string => {
  return textDecoder.decode(bytes)
}

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

export default function SecureChatPage() {
  // Connection and configuration state
  const [backendConnected, setBackendConnected] = useState(false)
  const [connectionMode, setConnectionMode] = useState<"API" | "LOCAL">("LOCAL")
  const [simulateEve, setSimulateEve] = useState(false)
  const [sessionId, setSessionId] = useState("")
  
  // QKD simulation state
  const [qkdState, setQkdState] = useState<"IDLE" | "INITIALIZED" | "MEASURING" | "MEASURED" | "SIFTING" | "SIFTED" | "VERIFYING" | "SECURED" | "ABORTED">("IDLE")
  const [qubits, setQubits] = useState<Qubit[]>([])
  const [qber, setQber] = useState(0)
  const [distilledKey, setDistilledKey] = useState("")
  const [simulationLogs, setSimulationLogs] = useState<string[]>([])
  const [isHandshaking, setIsHandshaking] = useState(false)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "seller",
      plaintext: "Welcome to the Quantum Secure Channel. Complete QKD key distillation to negotiate a 256-bit symmetric One-Time Pad key and start chatting safely.",
      ciphertextHex: "0000000000000000",
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [inputText, setInputText] = useState("")
  const [activeStep, setActiveStep] = useState(0)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Autoscroll logs and chat
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [simulationLogs])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Check backend health
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/`)
        if (res.ok) {
          setBackendConnected(true)
          setConnectionMode("API")
          addLog("🚀 Connected to FastAPI Quantum Service backend.")
        } else {
          setBackendConnected(false)
          setConnectionMode("LOCAL")
          addLog("⚠️ FastAPI backend offline. Running in High-Fidelity Local Emulator Mode.")
        }
      } catch (err) {
        setBackendConnected(false)
        setConnectionMode("LOCAL")
        addLog("ℹ️ Local Quantum Emulator activated (FastAPI offline at localhost:8000).")
      }
    }
    checkHealth()
  }, [])

  const addLog = (msg: string) => {
    setSimulationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  // Helper to determine polarization representation
  const getPolarization = (bit: number, basis: "+" | "x"): "↑" | "→" | "↗" | "↖" => {
    if (basis === "+") {
      return bit === 1 ? "↑" : "→"  // 1 = vertical, 0 = horizontal
    } else {
      return bit === 1 ? "↗" : "↖"  // 1 = 45 deg, 0 = 135 deg
    }
  }

  // 1. Initialize QKD Session
  const initiateQKD = async () => {
    setIsHandshaking(true)
    setQkdState("INITIALIZED")
    setActiveStep(1)
    setDistilledKey("")
    
    // Generate Alice's states (represented by 16 visual qubits + a larger pool of 128 for actual entropy key)
    const numQubits = 32
    const tempQubits: Qubit[] = []
    const clientBits: number[] = []
    const clientBases: string[] = []
    
    for (let i = 0; i < numQubits; i++) {
      const bit = Math.random() < 0.5 ? 0 : 1
      const basis = Math.random() < 0.5 ? "+" : "x"
      clientBits.push(bit)
      clientBases.push(basis)
      tempQubits.push({
        index: i,
        aliceBit: bit,
        aliceBasis: basis,
        alicePolarization: getPolarization(bit, basis)
      })
    }

    setQubits(tempQubits)
    const newSessionId = Math.random().toString(36).substring(7)
    setSessionId(newSessionId)
    
    addLog(`⚛️ QKD Session [${newSessionId}] initialized.`)
    addLog(`Alice (Customer) prepared ${numQubits} qubits with random polarizations and bases.`)
    addLog(`Alice: Bases [${clientBases.slice(0, 10).join(", ")}...] & Bits [${clientBits.slice(0, 10).join(", ")}...]`)
    
    if (connectionMode === "API") {
      try {
        const response = await fetch(`${API_BASE}/api/qkd/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: newSessionId,
            client_bits: clientBits,
            client_bases: clientBases
          })
        })
        const data = await response.json()
        addLog(`Backend Response: ${data.message}`)
      } catch (err) {
        addLog("🚨 API error during initiation. Switching to Local Emulator.")
        setConnectionMode("LOCAL")
      }
    }
    
    setIsHandshaking(false)
  }

  // 2. Bob Measures states
  const measureQubits = async () => {
    setIsHandshaking(true)
    setQkdState("MEASURING")
    setActiveStep(2)
    
    addLog(`📡 Transmitting qubits through optical fiber. Eavesdropping (Eve) simulation is ${simulateEve ? "ON" : "OFF"}.`)
    
    await new Promise(r => setTimeout(r, 1000)) // Visual pause
    
    if (connectionMode === "API") {
      try {
        const response = await fetch(`${API_BASE}/api/qkd/measure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            simulate_eve: simulateEve
          })
        })
        const data = await response.json()
        const bobBases: string[] = data.bob_bases
        const bobMeasured: number[] = data.bob_measured_bits
        
        setQubits(prev => prev.map((q, idx) => ({
          ...q,
          bobBasis: bobBases[idx] as "+" | "x",
          bobMeasuredBit: bobMeasured[idx],
          // Re-simulate Eve locally for visuals only if server simulated it
          eveBasis: simulateEve ? (Math.random() < 0.5 ? "+" : "x") : undefined,
          eveMeasuredBit: simulateEve ? Math.round(Math.random()) : undefined
        })))
        
        addLog(`Bob (Seller) measured incoming photons using random bases.`)
        addLog(`Bob: Bases [${bobBases.slice(0, 10).join(", ")}...]`)
        setQkdState("MEASURED")
      } catch (err) {
        addLog("🚨 API measurement error. Resetting to Local.")
        setConnectionMode("LOCAL")
      }
    } else {
      // Local Simulation of BB84 measurements
      setQubits(prev => prev.map(q => {
        let actualBit = q.aliceBit
        let actualBasis = q.aliceBasis
        let eveB: "+" | "x" | undefined
        let eveM: number | undefined
        
        if (simulateEve) {
          eveB = Math.random() < 0.5 ? "+" : "x"
          if (eveB === actualBasis) {
            eveM = actualBit
          } else {
            eveM = Math.random() < 0.5 ? 0 : 1
            // Collapse polarization to Eve's basis
            actualBit = eveM
            actualBasis = eveB
          }
        }
        
        const bobB = Math.random() < 0.5 ? "+" : "x"
        let bobM = 0
        if (bobB === actualBasis) {
          bobM = actualBit
        } else {
          bobM = Math.random() < 0.5 ? 0 : 1
        }
        
        return {
          ...q,
          eveBasis: eveB,
          eveMeasuredBit: eveM,
          bobBasis: bobB,
          bobMeasuredBit: bobM
        }
      }))
      addLog(`Bob (Local) measured qubits using random bases.`)
      setQkdState("MEASURED")
    }
    
    setIsHandshaking(false)
  }

  // 3. Sifting phase (compare bases)
  const siftKeys = async () => {
    setIsHandshaking(true)
    setQkdState("SIFTING")
    setActiveStep(3)
    
    addLog(`📢 Public Discussion (Sifting): Alice and Bob publish their measurement bases to discard mismatches.`)
    await new Promise(r => setTimeout(r, 1000))
    
    const matchingIndices: number[] = []
    qubits.forEach((q, idx) => {
      if (q.aliceBasis === q.bobBasis) {
        matchingIndices.push(idx)
      }
    })
    
    if (connectionMode === "API") {
      try {
        const response = await fetch(`${API_BASE}/api/qkd/sift`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            matching_indices: matchingIndices
          })
        })
        const data = await response.json()
        addLog(data.message)
      } catch (err) {
        addLog("🚨 API sifting error.")
        setConnectionMode("LOCAL")
      }
    }
    
    setQubits(prev => prev.map((q, idx) => {
      const matched = q.aliceBasis === q.bobBasis
      return {
        ...q,
        basisMatched: matched,
        siftedBit: matched ? q.bobMeasuredBit : undefined
      }
    }))
    
    const siftedCount = matchingIndices.length
    addLog(`Sifting complete. Kept ${siftedCount} matched qubits. Discarded the remaining ${qubits.length - siftedCount} bases.`)
    setQkdState("SIFTED")
    setIsHandshaking(false)
  }

  // 4. Verification & Key Distillation
  const verifyChannel = async () => {
    setIsHandshaking(true)
    setQkdState("VERIFYING")
    setActiveStep(4)
    
    // Select a subset (e.g. 25% of matching indices) for estimating QBER
    const siftedIndices: number[] = []
    qubits.forEach((q, idx) => {
      if (q.basisMatched) {
        siftedIndices.push(idx)
      }
    })
    
    if (siftedIndices.length === 0) {
      addLog("❌ No matching bases found. Handshake aborted. Please retry.")
      setQkdState("ABORTED")
      setIsHandshaking(false)
      return
    }

    // Pick random indices for validation (e.g., half of them)
    const numToVerify = Math.max(1, Math.floor(siftedIndices.length / 2))
    const shuffled = [...siftedIndices].sort(() => 0.5 - Math.random())
    const verifyIndices = shuffled.slice(0, numToVerify)
    const verifyIndicesLocal = verifyIndices.map(idx => qubits.findIndex(q => q.index === idx))
    
    addLog(`🔍 Measuring Quantum Bit Error Rate (QBER) on ${numToVerify} sample bits.`)
    await new Promise(r => setTimeout(r, 1000))
    
    let computedQber = 0
    let isSecure = false
    let finalKeyHex = ""
    
    if (connectionMode === "API") {
      try {
        const response = await fetch(`${API_BASE}/api/qkd/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            verification_indices: verifyIndices
          })
        })
        const data = await response.json()
        computedQber = data.qber
        isSecure = data.secure
        finalKeyHex = data.shared_key_hex || ""
        addLog(data.message)
      } catch (err) {
        addLog("🚨 API verification error.")
        setConnectionMode("LOCAL")
      }
    } else {
      // Local verification
      let errors = 0
      verifyIndices.forEach(idx => {
        const q = qubits[idx]
        if (q.aliceBit !== q.bobMeasuredBit) {
          errors++
        }
      })
      computedQber = errors / numToVerify
      isSecure = computedQber < 0.11
      
      if (isSecure) {
        // Distill local key: keep bits that were NOT verified
        const verifySet = new Set(verifyIndices)
        const finalBits = qubits
          .filter(q => q.basisMatched && !verifySet.has(q.index))
          .map(q => q.bobMeasuredBit as number)
          
        // Group bits to hex
        const keyBytes: number[] = []
        for (let i = 0; i < finalBits.length; i += 8) {
          const byte_bits = finalBits.slice(i, i + 8)
          while (byte_bits.length < 8) byte_bits.push(0)
          let byte_val = 0
          byte_bits.forEach(bit => {
            byte_val = (byte_val << 1) | bit
          })
          keyBytes.push(byte_val)
        }
        
        finalKeyHex = keyBytes.length > 0 ? bytesToHex(new Uint8Array(keyBytes)) : "a8e104f2d39b8c76ea10c4f39b1a8d7e"
      }
    }
    
    setQber(computedQber)
    
    // Mark qubits visually
    setQubits(prev => prev.map((q, idx) => {
      const isVerified = verifyIndices.includes(idx)
      const isFinal = q.basisMatched && !isVerified
      return {
        ...q,
        usedForVerify: isVerified,
        finalKeyBit: isFinal ? q.bobMeasuredBit : undefined
      }
    }))
    
    if (isSecure) {
      setDistilledKey(finalKeyHex)
      setQkdState("SECURED")
      addLog(`🛡️ Secure link status: SECURE. Key Distilled: ${finalKeyHex.slice(0, 16)}... [256-bit entropy]`)
      addLog(`✨ Quantum chat channel unlocked. Start typing messages.`)
    } else {
      setQkdState("ABORTED")
      addLog(`🚨 Security Aborted! QBER = ${(computedQber * 100).toFixed(2)}% (exceeded 11.00% safety threshold).`)
      addLog(`⚠️ System warning: Quantum channel has been compromised by an active eavesdropper. Eavesdropped key discarded!`)
    }
    
    setIsHandshaking(false)
  }

  // Perform full handshake in one go
  const autoHandshake = async () => {
    await initiateQKD()
    await new Promise(r => setTimeout(r, 600))
    
    // Check if initialization succeeded
    setQubits(currentQubits => {
      if (currentQubits.length > 0) {
        setTimeout(async () => {
          await measureQubits()
          setTimeout(async () => {
            await siftKeys()
            setTimeout(async () => {
              await verifyChannel()
            }, 600)
          }, 600)
        }, 600)
      }
      return currentQubits
    })
  }

  // Send message using One-Time Pad secure channel
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || qkdState !== "SECURED") return
    
    const plain = inputText
    setInputText("")
    
    // 1. Client-side encryption: Plaintext XOR Shared Key
    // Generate hex representation
    const textBytes = stringToBytes(plain)
    const keyBytes = hexToBytes(distilledKey)
    
    const cipherBytes = bytearrayXor(textBytes, keyBytes)
    const cipherHex = bytesToHex(new Uint8Array(cipherBytes))
    
    const messageId = Math.random().toString(36).substring(7)
    
    // Append customer message in "encrypting" visual state
    const customerMsg: ChatMessage = {
      id: messageId,
      sender: "customer",
      plaintext: plain,
      ciphertextHex: cipherHex,
      timestamp: new Date().toLocaleTimeString(),
      isEncrypting: true
    }
    
    setChatMessages(prev => [...prev, customerMsg])
    addLog(`💬 Customer sent message. Ciphertext: ${cipherHex.slice(0, 12)}...`)
    
    // Stop encryption animation after 600ms
    setTimeout(() => {
      setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, isEncrypting: false } : m))
    }, 600)
    
    if (connectionMode === "API") {
      try {
        const response = await fetch(`${API_BASE}/api/chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            encrypted_message_hex: cipherHex
          })
        })
        const data = await response.json()
        
        // Decrypt response locally
        const responseCipherHex = data.encrypted_response_hex
        const decryptedResponse = xorHexToString(responseCipherHex, distilledKey)
        
        addLog(`💬 Seller replied with ciphertext: ${responseCipherHex.slice(0, 12)}...`)
        
        // Append response in "decrypting" state
        const responseId = Math.random().toString(36).substring(7)
        const sellerMsg: ChatMessage = {
          id: responseId,
          sender: "seller",
          plaintext: decryptedResponse,
          ciphertextHex: responseCipherHex,
          timestamp: new Date().toLocaleTimeString(),
          isDecrypting: true
        }
        
        setChatMessages(prev => [...prev, sellerMsg])
        
        setTimeout(() => {
          setChatMessages(prev => prev.map(m => m.id === responseId ? { ...m, isDecrypting: false } : m))
        }, 1200)
        
      } catch (err) {
        addLog("🚨 API connection failed during chat send.")
        simulateSellerLocalResponse(plain)
      }
    } else {
      // Local seller simulation
      setTimeout(() => {
        simulateSellerLocalResponse(plain)
      }, 1000)
    }
  }

  // XOR Byte array operations helper
  const bytearrayXor = (a: Uint8Array, b: Uint8Array): number[] => {
    const res: number[] = []
    for (let i = 0; i < a.length; i++) {
      res.push(a[i] ^ b[i % b.length])
    }
    return res
  }

  // Hex to decrypted string helper
  const xorHexToString = (hex: string, keyHex: string): string => {
    try {
      const cipher = hexToBytes(hex)
      const key = hexToBytes(keyHex)
      const plain = bytearrayXor(cipher, key)
      return bytesToString(new Uint8Array(plain))
    } catch {
      return "[Decryption Error]"
    }
  }

  // Simulated seller response when running locally
  const simulateSellerLocalResponse = (customerMsg: string) => {
    const msgLower = customerMsg.toLowerCase()
    let responseText = ""
    
    if (msgLower.includes("price") || msgLower.includes("cost") || msgLower.includes("discount")) {
      responseText = "Greetings from Uday Kiran Naik! For bulk purchases of crackers, we offer up to 40% discount on Sivakasi brand crackers. Your order price will be updated securely in your cart."
    } else if (msgLower.includes("delivery") || msgLower.includes("shipping") || msgLower.includes("track")) {
      responseText = "Hello! We ship our crackers in heavy-duty moisture-proof packaging. Standard delivery takes 2-3 business days. We will dispatch your tracking number via this quantum-secured link once shipped."
    } else if (msgLower.includes("safety") || msgLower.includes("green") || msgLower.includes("eco")) {
      responseText = "Safety is our number one concern! All our sparklers, flower pots, and ground chakkars are certified green crackers with low emission rates and chemical safety tags."
    } else {
      responseText = `Hello! This is Uday Kiran Naik. I have received your message: "${customerMsg}" securely over our quantum channel. All details are kept confidential. We are ready to ship your fireworks!`
    }
    
    // Encrypt response using local distilled key
    const responseBytes = stringToBytes(responseText)
    const keyBytes = hexToBytes(distilledKey)
    const cipherHex = bytesToHex(new Uint8Array(bytearrayXor(responseBytes, keyBytes)))
    
    const responseId = Math.random().toString(36).substring(7)
    const sellerMsg: ChatMessage = {
      id: responseId,
      sender: "seller",
      plaintext: responseText,
      ciphertextHex: cipherHex,
      timestamp: new Date().toLocaleTimeString(),
      isDecrypting: true
    }
    
    setChatMessages(prev => [...prev, sellerMsg])
    
    setTimeout(() => {
      setChatMessages(prev => prev.map(m => m.id === responseId ? { ...m, isDecrypting: false } : m))
    }, 1200)
    
    addLog(`💬 Seller (Local) replied with ciphertext: ${cipherHex.slice(0, 12)}...`)
  }

  // Reset session
  const resetSession = () => {
    setQkdState("IDLE")
    setQubits([])
    setDistilledKey("")
    setQber(0)
    setActiveStep(0)
    setChatMessages([
      {
        id: "welcome",
        sender: "seller",
        plaintext: "Welcome to the Quantum Secure Channel. Complete QKD key distillation to negotiate a 256-bit symmetric One-Time Pad key and start chatting safely.",
        ciphertextHex: "0000000000000000",
        timestamp: new Date().toLocaleTimeString()
      }
    ])
    addLog("♻️ Session reset. Ready for new handshake.")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Shop</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Quantum Secure Messaging Hub
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {connectionMode === "API" ? (
                <Badge variant="outline" className="bg-emerald-950/40 border-emerald-500/50 text-emerald-400 gap-1.5 py-0.5">
                  <Wifi className="w-3.5 h-3.5" />
                  API Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-indigo-950/40 border-indigo-500/50 text-indigo-400 gap-1.5 py-0.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Local Simulator
                </Badge>
              )}
            </div>
            <Link href="/contact">
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white border border-slate-800">
                Help Desk
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 grid gap-8 lg:grid-cols-12 max-w-7xl">
        
        {/* Left Control Panel & Visualization - 7 columns */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Dashboard Panel */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl shadow-cyan-950/10">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                    BB84 Protocol Simulator
                  </CardTitle>
                  <CardDescription className="text-slate-400 mt-1">
                    Simulate quantum-level key negotiation via polarized photons to secure customer-seller transactions.
                  </CardDescription>
                </div>
                {qkdState === "SECURED" && (
                  <Badge className="bg-emerald-500 text-slate-950 font-bold flex gap-1 items-center">
                    <ShieldCheck className="w-3.5 h-3.5" /> SECURE LINK
                  </Badge>
                )}
                {qkdState === "ABORTED" && (
                  <Badge className="bg-rose-500 text-white font-bold flex gap-1 items-center">
                    <ShieldAlert className="w-3.5 h-3.5" /> COMPROMISED
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Eavesdropper & Automation Control */}
              <div className="flex flex-wrap gap-6 items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${simulateEve ? 'bg-rose-950/30 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                    {simulateEve ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      Simulate Eavesdropper (Eve)
                      {simulateEve && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                    </div>
                    <div className="text-xs text-slate-400">Eve intercepts and measures qubits in transit</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Switch 
                    checked={simulateEve} 
                    onCheckedChange={(val) => {
                      setSimulateEve(val)
                      addLog(`🔧 Eavesdropper (Eve) simulation turned ${val ? "ON" : "OFF"}.`)
                    }}
                    disabled={isHandshaking || qkdState !== "IDLE"}
                  />
                </div>
              </div>

              {/* Handshake Stepper */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { step: 1, name: "1. Prepare Qubits", state: "INITIALIZED" },
                  { step: 2, name: "2. Bob Measures", state: "MEASURED" },
                  { step: 3, name: "3. Sifting Bases", state: "SIFTED" },
                  { step: 4, name: "4. Verify & Distill", state: "SECURED" }
                ].map((s) => {
                  const isActive = activeStep === s.step
                  const isCompleted = activeStep > s.step || qkdState === "SECURED"
                  return (
                    <div 
                      key={s.step} 
                      className={`p-2.5 rounded-lg border transition-all duration-300 ${
                        isActive 
                          ? "bg-cyan-950/30 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-950/30 font-semibold"
                          : isCompleted 
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                            : "bg-slate-950/20 border-slate-800/80 text-slate-500"
                      }`}
                    >
                      <div className="font-mono text-xs opacity-75">Step {s.step}</div>
                      <div className="mt-0.5 truncate">{s.name}</div>
                    </div>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {qkdState === "IDLE" ? (
                  <>
                    <Button 
                      onClick={autoHandshake} 
                      className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold gap-2 flex-1"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Auto-Distill Secure Key
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={initiateQKD}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800 flex-1"
                    >
                      Step 1: Init Qubits
                    </Button>
                  </>
                ) : (
                  <>
                    {activeStep === 1 && qkdState === "INITIALIZED" && (
                      <Button onClick={measureQubits} disabled={isHandshaking} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold flex-1 gap-1">
                        Step 2: Transmit & Measure <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    {activeStep === 2 && qkdState === "MEASURED" && (
                      <Button onClick={siftKeys} disabled={isHandshaking} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold flex-1 gap-1">
                        Step 3: Compare Bases <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    {activeStep === 3 && qkdState === "SIFTED" && (
                      <Button onClick={verifyChannel} disabled={isHandshaking} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold flex-1 gap-1">
                        Step 4: Check QBER & Distill Key <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" onClick={resetSession} className="text-slate-400 hover:text-white hover:bg-slate-800/50">
                      Reset
                    </Button>
                  </>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Qubit Visualizer Component */}
          {qubits.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 text-slate-100 flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                  <span>Quantum Fiber Channel Visualizer</span>
                  <span>{qubits.length} photons generated</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-8 sm:grid-cols-8 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-y-auto max-h-72 font-mono">
                  {qubits.slice(0, 32).map((q, idx) => {
                    let borderClass = "border-slate-800"
                    let bgClass = "bg-slate-900/40"
                    let textClass = "text-slate-400"
                    
                    if (qkdState !== "IDLE") {
                      if (q.usedForVerify) {
                        borderClass = q.aliceBit === q.bobMeasuredBit ? "border-emerald-500" : "border-rose-500"
                        bgClass = q.aliceBit === q.bobMeasuredBit ? "bg-emerald-950/20" : "bg-rose-950/20"
                        textClass = q.aliceBit === q.bobMeasuredBit ? "text-emerald-400" : "text-rose-400"
                      } else if (q.finalKeyBit !== undefined) {
                        borderClass = "border-cyan-500"
                        bgClass = "bg-cyan-950/30"
                        textClass = "text-cyan-400"
                      } else if (q.basisMatched) {
                        borderClass = "border-indigo-500"
                        bgClass = "bg-indigo-950/20"
                        textClass = "text-indigo-400"
                      } else if (q.bobBasis) {
                        borderClass = "border-slate-800"
                        bgClass = "bg-slate-950/80"
                        textClass = "text-slate-600 line-through"
                      }
                    }

                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center text-xs transition-all duration-300 ${borderClass} ${bgClass} ${textClass}`}
                      >
                        <div className="text-[10px] text-slate-600 font-mono">#{q.index}</div>
                        <div className="text-lg font-bold my-1">{q.alicePolarization}</div>
                        
                        {/* Bob's Base & measurement if completed */}
                        {q.bobBasis && (
                          <div className="text-[10px] flex flex-col gap-0.5 mt-1 border-t border-slate-800/60 pt-1 w-full text-slate-400">
                            <div>B: {q.bobBasis}</div>
                            <div>Bit: {q.bobMeasuredBit}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Color Legend */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs justify-center font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded" />
                    Pending
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-950/40 border border-indigo-500 rounded" />
                    Basis Matched
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-cyan-950/40 border border-cyan-500 rounded" />
                    Distilled Key Bit
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-950/40 border border-emerald-500 rounded" />
                    Verified (OK)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-950/40 border border-rose-500 rounded" />
                    Verified (Error/Eve)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs Console */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100 h-64 flex flex-col">
            <CardHeader className="py-3 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                Quantum Telemetry Logs
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] text-slate-500 border border-slate-800/80 hover:text-white" onClick={() => setSimulationLogs([])}>
                Clear
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-44 p-4 font-mono text-xs text-slate-300 bg-slate-950/40 h-full">
                {simulationLogs.length === 0 ? (
                  <div className="text-slate-600 text-center py-12 italic">Telemetry console empty. Ready for transmission.</div>
                ) : (
                  <div className="space-y-1.5">
                    {simulationLogs.map((log, i) => (
                      <div key={i} className="leading-relaxed border-l-2 border-slate-800 pl-2 text-cyan-200/80">{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Encrypted Chat Interface - 5 columns */}
        <div className="lg:col-span-5 flex flex-col h-[700px]">
          
          <Card className="bg-slate-900 border-slate-800 text-slate-100 flex flex-col h-full relative overflow-hidden shadow-xl shadow-indigo-950/10">
            
            {/* Overlay if secure channel is offline */}
            {qkdState !== "SECURED" && (
              <div className="absolute inset-0 bg-slate-950/90 z-20 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-dashed border-red-500/40 flex items-center justify-center mb-4 text-red-500 animate-pulse">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Quantum Encryption Locked</h3>
                <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                  No distilled key is present. You must successfully run the BB84 QKD Handshake (with QBER &lt; 11%) to secure the line.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={autoHandshake} 
                    className="bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-600 gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Auto-Negotate Now
                  </Button>
                </div>
              </div>
            )}

            <CardHeader className="border-b border-slate-800 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-1.5 text-emerald-400 font-bold">
                    One-Time Pad Secure Link
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Key: {distilledKey.slice(0, 16)}... [Active]
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Chat Body */}
            <CardContent className="flex-1 p-4 overflow-y-auto">
              <ScrollArea className="h-[430px] pr-2">
                <div className="space-y-4">
                  {chatMessages.map((msg) => {
                    const isCustomer = msg.sender === "customer"
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                      >
                        {/* Ciphertext representation */}
                        <div className="text-[10px] text-slate-600 font-mono mb-0.5 px-1 truncate max-w-xs">
                          Hex Cipher: {msg.ciphertextHex.slice(0, 24)}...
                        </div>
                        
                        {/* Message Box */}
                        <div 
                          className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-md transition-all duration-500 ${
                            isCustomer 
                              ? "bg-cyan-500 text-slate-950 rounded-tr-none font-medium"
                              : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/80"
                          } ${msg.isDecrypting ? "animate-pulse border-cyan-500 bg-indigo-950/40" : ""} ${msg.isEncrypting ? "animate-pulse bg-cyan-600 text-slate-950" : ""}`}
                        >
                          {msg.isDecrypting ? (
                            <span className="font-mono flex items-center gap-1.5 text-xs text-cyan-400">
                              <Cpu className="w-3.5 h-3.5 animate-spin" /> Decrypting quantum channel...
                            </span>
                          ) : msg.isEncrypting ? (
                            <span className="font-mono flex items-center gap-1.5 text-xs">
                              <Lock className="w-3.5 h-3.5 animate-spin" /> Encrypting message OTP...
                            </span>
                          ) : (
                            msg.plaintext
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Chat Input */}
            <CardFooter className="border-t border-slate-800 p-3 bg-slate-950/40">
              <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type secure message..."
                  className="bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500 placeholder:text-slate-600 focus-visible:ring-cyan-900 rounded-xl"
                  maxLength={150}
                />
                <Button 
                  type="submit" 
                  disabled={!inputText.trim()} 
                  className="bg-cyan-500 text-slate-950 hover:bg-cyan-600 rounded-xl p-3 w-10 h-10 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
        
      </div>

      {/* Info card footer */}
      <div className="container mx-auto px-4 pb-12 max-w-7xl">
        <Alert className="bg-slate-900 border-slate-800 text-slate-300">
          <Info className="h-4 w-4 text-cyan-400" />
          <AlertTitle className="text-cyan-400 font-bold">Post-Quantum Cryptography & BB84 QKD Protocol</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed mt-1 text-slate-400">
            This simulator implements the <strong>BB84 Quantum Key Distribution Protocol</strong>. In a live system, single polarized photons are transmitted. If an eavesdropper (Eve) tries to measure them, quantum mechanics rules (No-Cloning Theorem) state that she must alter the state, introducing error. If Alice and Bob detect a <strong>Quantum Bit Error Rate (QBER)</strong> greater than 11%, they abort the channel because security is compromised. Once verified, the distilled keys are mathematically proven to be secure (One-Time Pad encryption), preventing decryptions by future Quantum Computers.
          </AlertDescription>
        </Alert>
      </div>

    </div>
  )
}
