"use client"

import { useState, useEffect, useCallback } from "react"
import type { WalletClient, Address } from "viem"
import { connectRabbyWallet, connectLedgerDevice, disconnectLedgerDevice, signWelcomeMessage } from "@/lib/wallet"

export interface WalletState {
  isConnected: boolean
  address: Address | null
  walletClient: WalletClient | null
  walletType: "rabby" | "ledger" | null
  isConnecting: boolean
  error: string | null
  ledgerStatus: string | null
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
  })

  // Connect to Rabby wallet
  const connectRabby = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }))

    try {
      const walletClient = await connectRabbyWallet()
      if (!walletClient) throw new Error("Failed to create Rabby wallet client")

      const addresses = await walletClient.getAddresses()
      const address = addresses[0]

      setWalletState({
        isConnected: true,
        address,
        walletClient,
        walletType: "rabby",
        isConnecting: false,
        error: null,
        ledgerStatus: null,
      })

      return { walletClient, address }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error connecting to Rabby"
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }))
      throw error
    }
  }, [])

  // Connect to Ledger device with enhanced status updates
  const connectLedger = useCallback(async () => {
    setWalletState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
      ledgerStatus: "Initializing...",
    }))

    try {
      const { walletClient, address } = await connectLedgerDevice((status: string) => {
        setWalletState((prev) => ({
          ...prev,
          ledgerStatus: status,
        }))
      })

      setWalletState({
        isConnected: true,
        address,
        walletClient,
        walletType: "ledger",
        isConnecting: false,
        error: null,
        ledgerStatus: "Connected successfully!",
      })

      return { walletClient, address }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error connecting to Ledger"
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
        ledgerStatus: null,
      }))
      throw error
    }
  }, [])

  // Sign welcome message and authenticate with enhanced status updates
  const signAndAuthenticate = useCallback(async () => {
    if (!walletState.walletClient || !walletState.address) {
      throw new Error("Wallet not connected")
    }

    try {
      setWalletState((prev) => ({
        ...prev,
        error: null,
        ledgerStatus: walletState.walletType === "ledger" ? "Preparing to sign..." : null,
      }))

      const signature = await signWelcomeMessage(walletState.walletClient, walletState.address, (status: string) => {
        if (walletState.walletType === "ledger") {
          setWalletState((prev) => ({ ...prev, ledgerStatus: status }))
        }
      })

      // Store authentication data in localStorage
      localStorage.setItem(
        "payroll_auth",
        JSON.stringify({
          address: walletState.address,
          walletType: walletState.walletType || "unknown",
          signature,
          timestamp: Date.now(),
        }),
      )

      return signature
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed"
      setWalletState((prev) => ({
        ...prev,
        error: errorMessage,
        ledgerStatus: null,
      }))
      throw error
    }
  }, [walletState.walletClient, walletState.address, walletState.walletType])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      // Disconnect Ledger if connected
      if (walletState.walletType === "ledger") {
        await disconnectLedgerDevice()
      }
    } catch (error) {
      console.error("Error disconnecting:", error)
    }

    setWalletState({
      isConnected: false,
      address: null,
      walletClient: null,
      walletType: null,
      isConnecting: false,
      error: null,
      ledgerStatus: null,
    })
    localStorage.removeItem("payroll_auth")
  }, [walletState.walletType])

  // Check for existing authentication
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem("payroll_auth")
      if (authData) {
        try {
          const { address, walletType, timestamp } = JSON.parse(authData)
          // Check if auth is less than 24 hours old
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            console.log(`Found existing ${walletType} auth for:`, address)
          } else {
            localStorage.removeItem("payroll_auth")
          }
        } catch (error) {
          localStorage.removeItem("payroll_auth")
        }
      }
    }

    checkAuth()
  }, [])

  return {
    ...walletState,
    connectRabby,
    connectLedger,
    signAndAuthenticate,
    disconnect,
  }
}
