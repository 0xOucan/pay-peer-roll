"use client"

import { useState, useEffect, useCallback } from "react"
import type { WalletClient, Address } from "viem"
import { 
  connectRabbyWallet, 
  connectLedgerDevice, 
  disconnectLedgerDevice, 
  signWelcomeMessage 
} from "@/lib/wallet"
import { isLedgerConnected } from "@/lib/ledger-integration"

// Types for Ledger device interactions
export type LedgerInteractionType = 
  | "unlock-device" 
  | "confirm-open-app" 
  | "verify-address" 
  | "sign-personal-message" 
  | null

export interface WalletState {
  isConnected: boolean
  address: Address | null
  walletClient: WalletClient | null
  walletType: "rabby" | "ledger" | null
  isConnecting: boolean
  error: string | null
  ledgerStatus: string | null
  ledgerInteraction: LedgerInteractionType
  sessionId: string | null
  isAuthenticated: boolean
  signature: string | null
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    walletClient: null,
    walletType: null,
    isConnecting: false,
    error: null,
    ledgerStatus: null,
    ledgerInteraction: null,
    sessionId: null,
    isAuthenticated: false,
    signature: null,
  })

  // Check Ledger connection status on mount
  useEffect(() => {
    if (walletState.walletType === "ledger") {
      const connected = isLedgerConnected()
      if (!connected && walletState.isConnected) {
        setWalletState(prev => ({
          ...prev,
          isConnected: false,
          address: null,
          sessionId: null,
          isAuthenticated: false,
          signature: null,
        }))
      }
    }
  }, [walletState.walletType, walletState.isConnected])

  const connectRabby = useCallback(async () => {
    setWalletState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null,
      ledgerStatus: null,
      ledgerInteraction: null,
    }))

    try {
      const walletClient = await connectRabbyWallet()
      if (!walletClient) {
        throw new Error("Failed to create wallet client")
      }

      const accounts = await walletClient.getAddresses()
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }

      const address = accounts[0]

      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address,
        walletClient,
        walletType: "rabby",
        isConnecting: false,
        error: null,
      }))

      return { walletClient, address }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to Rabby wallet"
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }))
      throw error
    }
  }, [])

  const connectLedger = useCallback(async () => {
    setWalletState(prev => ({ 
      ...prev,
      isConnecting: true,
      error: null,
      ledgerStatus: "Initializing...",
      ledgerInteraction: null,
    }))

    try {
      const result = await connectLedgerDevice((status) => {
        setWalletState(prev => ({ ...prev, ledgerStatus: status }))
        
        // Update interaction type based on status
        if (status.includes("unlock")) {
          setWalletState(prev => ({ ...prev, ledgerInteraction: "unlock-device" }))
        } else if (status.includes("open") && status.includes("app")) {
          setWalletState(prev => ({ ...prev, ledgerInteraction: "confirm-open-app" }))
        } else if (status.includes("verify") && status.includes("address")) {
          setWalletState(prev => ({ ...prev, ledgerInteraction: "verify-address" }))
        } else {
          setWalletState(prev => ({ ...prev, ledgerInteraction: null }))
        }
      })

      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address: result.address,
        walletClient: null, // Ledger doesn't use viem wallet client
        walletType: "ledger",
        isConnecting: false,
        error: null,
        sessionId: result.sessionId,
        ledgerStatus: "Connected successfully!",
        ledgerInteraction: null,
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to Ledger device"
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
        ledgerStatus: null,
        ledgerInteraction: null,
      }))
      throw error
    }
  }, [])

  const signWelcomeMessageAndAuthenticate = useCallback(async () => {
    if (!walletState.isConnected || !walletState.walletType) {
      throw new Error("Wallet not connected")
    }

    setWalletState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null,
      ledgerStatus: walletState.walletType === "ledger" ? "Preparing to sign..." : null,
    }))

    try {
      const signature = await signWelcomeMessage(
        walletState.walletType,
        walletState.walletClient || undefined,
        walletState.address || undefined,
        walletState.walletType === "ledger" ? (status) => {
          setWalletState(prev => ({ ...prev, ledgerStatus: status }))
          
          // Update interaction type based on status
          if (status.includes("sign") && status.includes("message")) {
            setWalletState(prev => ({ ...prev, ledgerInteraction: "sign-personal-message" }))
          } else if (status.includes("unlock")) {
            setWalletState(prev => ({ ...prev, ledgerInteraction: "unlock-device" }))
          } else if (status.includes("open") && status.includes("app")) {
            setWalletState(prev => ({ ...prev, ledgerInteraction: "confirm-open-app" }))
          } else {
            setWalletState(prev => ({ ...prev, ledgerInteraction: null }))
          }
        } : undefined
      )

      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        isAuthenticated: true,
        signature,
        error: null,
        ledgerStatus: walletState.walletType === "ledger" ? "Authentication successful!" : null,
        ledgerInteraction: null,
      }))

      return signature
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign welcome message"
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
        ledgerStatus: null,
        ledgerInteraction: null,
      }))
      throw error
    }
  }, [walletState.isConnected, walletState.walletType, walletState.walletClient, walletState.address])

  const disconnect = useCallback(async () => {
    try {
      if (walletState.walletType === "ledger") {
        await disconnectLedgerDevice()
      }
    } catch (error) {
      console.error("Error during disconnect:", error)
    }

    setWalletState({
      isConnected: false,
      address: null,
      walletClient: null,
      walletType: null,
      isConnecting: false,
      error: null,
      ledgerStatus: null,
      ledgerInteraction: null,
      sessionId: null,
      isAuthenticated: false,
      signature: null,
    })
  }, [walletState.walletType])

  const clearError = useCallback(() => {
    setWalletState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...walletState,
    connectRabby,
    connectLedger,
    signWelcomeMessageAndAuthenticate,
    disconnect,
    clearError,
  }
}
