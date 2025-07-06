"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/useWallet"
import ProductionDebugger from "@/components/ProductionDebugger"

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false)
  const [authStep, setAuthStep] = useState<"connect" | "sign" | "success">("connect")
  const router = useRouter()

  const {
    isConnected,
    address,
    isConnecting,
    error,
    walletType,
    connectRabby,
    connectLedger,
    signWelcomeMessageAndAuthenticate,
    ledgerStatus,
    ledgerInteraction,
  } = useWallet()

  const handleRabbyConnect = async () => {
    try {
      await connectRabby()
      setAuthStep("sign")
    } catch (error) {
      console.error("Rabby connection failed:", error)
    }
  }

  const handleLedgerConnect = async () => {
    try {
      await connectLedger()
      setAuthStep("sign")
    } catch (error) {
      console.error("Ledger connection failed:", error)
      // The error will be displayed in the error section automatically
    }
  }

  const handleSignAndEnter = async () => {
    try {
      await signWelcomeMessageAndAuthenticate()
      setAuthStep("success")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Authentication failed:", error)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#008080] flex items-center justify-center p-4"
      style={{
        backgroundImage: `repeating-linear-gradient(
        45deg,
        #008080,
        #008080 2px,
        #006666 2px,
        #006666 4px
      )`,
      }}
    >
      <div className="max-w-4xl w-full">
        {/* Main Window */}
        <div className="bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-lg">
          {/* Title Bar */}
          <div className="bg-gradient-to-r from-[#0000FF] to-[#000080] text-white px-2 py-1 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border border-gray-400"></div>
              <span className="font-bold text-sm">Pay-Peer-Roll v1.0 - Wallet Authentication</span>
            </div>
            <div className="flex space-x-1">
              <button className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs">
                _
              </button>
              <button className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs">
                □
              </button>
              <button className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs">
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">🧻</div>
              <h1 className="text-4xl font-bold text-black mb-2" style={{ fontFamily: "MS Sans Serif, sans-serif" }}>
                PAY-PEER-ROLL
              </h1>
              <div className="bg-[#808080] h-2 w-64 mx-auto mb-4 border border-inset"></div>
              <p className="text-lg text-black">Decentralized Payroll Distribution System</p>
              <div className="flex justify-center space-x-4 mt-4 text-2xl">
                <span title="Money">💰</span>
                <span title="Payments">💳</span>
                <span title="Privacy">🔒</span>
                <span title="Blockchain">⛓️</span>
              </div>
            </div>

            {/* Authentication Panel */}
            <div className="max-w-md mx-auto">
              <div className="bg-[#C0C0C0] border-2 border-inset p-6">
                {/* Step 1: Connect Wallet */}
                {authStep === "connect" && (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-[#C0C0C0] border-2 border-inset mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">🔗</span>
                      </div>
                      <h2 className="text-xl font-bold text-black mb-2">Connect Wallet</h2>
                      <p className="text-sm text-black">Choose your preferred wallet to continue</p>
                    </div>

                    <div className="space-y-4">
                      {/* Rabby Wallet Button */}
                      <button
                        onClick={handleRabbyConnect}
                        disabled={isConnecting}
                        className={`
                          w-full py-3 px-6 font-bold text-black flex items-center justify-center space-x-3
                          bg-[#C0C0C0] border-2 border-outset
                          hover:bg-[#E0E0E0] active:border-inset
                          transition-all duration-100
                          ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        <span className="text-2xl">🦊</span>
                        <span>{isConnecting ? "Connecting..." : "Connect Rabby Wallet"}</span>
                      </button>

                      {/* Ledger Device Button */}
                      <button
                        onClick={handleLedgerConnect}
                        disabled={isConnecting}
                        className={`
                          w-full py-3 px-6 font-bold text-black flex items-center justify-center space-x-3
                          bg-[#C0C0C0] border-2 border-outset
                          hover:bg-[#E0E0E0] active:border-inset
                          transition-all duration-100
                          ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        <span className="text-2xl">🔐</span>
                        <span>{isConnecting ? "Connecting..." : "Connect Ledger Device"}</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Step 2: Sign Message */}
                {authStep === "sign" && isConnected && (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-[#C0C0C0] border-2 border-inset mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">✍️</span>
                      </div>
                      <h2 className="text-xl font-bold text-black mb-2">Sign Welcome Message</h2>
                      <p className="text-sm text-black mb-4">
                        {walletType === "ledger"
                          ? "Follow the instructions on your Ledger device"
                          : "Please sign the message to authenticate"}
                      </p>

                      {/* Connected Address */}
                      <div className="bg-white border-2 border-inset p-2 mb-4">
                        <div className="text-xs text-black font-mono">
                          {walletType === "ledger" ? "🔐 Ledger" : "🦊 Rabby"}: {address?.slice(0, 6)}...
                          {address?.slice(-4)}
                        </div>
                      </div>

                      {/* Ledger Status Display */}
                      {walletType === "ledger" && ledgerStatus && (
                        <div className="bg-blue-100 border-2 border-inset p-3 mb-4">
                          <div className="text-sm text-blue-800 font-bold">🔐 Ledger Status:</div>
                          <div className="text-xs text-blue-600">{ledgerStatus}</div>

                          {/* Show specific interaction instructions */}
                          {ledgerInteraction && (
                            <div className="mt-2 text-xs text-blue-700">
                              {ledgerInteraction === "unlock-device" && "🔓 Please unlock your Ledger device"}
                              {ledgerInteraction === "confirm-open-app" && "📱 Please open the Ethereum app"}
                              {ledgerInteraction === "verify-address" && "👁️ Please verify the address on screen"}
                              {ledgerInteraction === "sign-personal-message" &&
                                "✍️ Please review and confirm the message"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-white border-2 border-inset p-4 mb-6 text-left">
                      <div className="text-sm text-black font-mono">
                        <div className="font-bold mb-2">Message to sign:</div>
                        <div className="text-xs">
                          Welcome to Pay-Peer-Roll! 🧻<br />
                          <br />
                          Please sign this message to authenticate...
                          <br />
                          Address: {address}
                          <br />
                          Timestamp: {new Date().toISOString()}
                          <br />
                          {walletType === "ledger" && (
                            <div className="mt-2 text-blue-600">⚠️ This message will appear on your Ledger device</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSignAndEnter}
                      disabled={isConnecting}
                      className={`
                        w-full py-3 px-6 font-bold text-black 
                        bg-[#C0C0C0] border-2 border-outset 
                        hover:bg-[#E0E0E0] active:border-inset 
                        transition-all duration-100
                        ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      {isConnecting
                        ? walletType === "ledger"
                          ? "🔐 Follow Ledger Instructions..."
                          : "✍️ Signing..."
                        : "✍️ Sign Message & Enter"}
                    </button>
                  </>
                )}

                {/* Step 3: Success */}
                {authStep === "success" && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#C0C0C0] border-2 border-inset mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h2 className="text-xl font-bold text-black mb-2">Authentication Successful!</h2>
                    <p className="text-sm text-black mb-4">Redirecting to dashboard...</p>
                    <div className="bg-white border-2 border-inset p-2">
                      <div className="bg-blue-600 h-4 animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-4 bg-red-100 border-2 border-inset p-3">
                    <div className="text-sm text-red-800 font-bold">⚠️ Error:</div>
                    <div className="text-xs text-red-600">{error}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-8 bg-[#C0C0C0] border-2 border-inset p-2">
              <div className="flex items-center justify-between text-sm text-black">
                <div className="flex items-center space-x-4">
                  <span>{isConnected ? "🟢 Wallet Connected" : "🔴 Wallet Disconnected"}</span>
                  <span>🔒 Secure Authentication</span>
                  <span>⛓️ Blockchain Ready</span>
                </div>
                <div>{authStep === "connect" ? "Ready" : authStep === "sign" ? "Signing" : "Success"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Production Debugger */}
      <ProductionDebugger />
    </div>
  )
}
