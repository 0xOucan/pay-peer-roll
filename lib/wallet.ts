import { createWalletClient, custom, type WalletClient, type Address } from "viem"
import { mainnet } from "viem/chains"
import { connectRealLedger, signRealMessage, disconnectRealLedger, getLedgerManager } from "./ledger-real"

// Rabby wallet connection (unchanged)
export const connectRabbyWallet = async (): Promise<WalletClient | null> => {
  if (typeof window === "undefined") return null

  if (!window.ethereum?.isRabby) {
    throw new Error("Rabby wallet not detected. Please install Rabby wallet extension.")
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in Rabby wallet")
    }

    const walletClient = createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum),
    })

    return walletClient
  } catch (error) {
    console.error("Failed to connect to Rabby wallet:", error)
    throw error
  }
}

// Real Ledger connection - no mocks
export const connectLedgerDevice = async (
  onStatusUpdate?: (status: string) => void,
): Promise<{
  walletClient: WalletClient
  address: Address
}> => {
  try {
    // Connect to real Ledger device
    const { address } = await connectRealLedger(onStatusUpdate)

    // Create custom transport for Viem that uses real Ledger
    const customTransport = custom({
      async request({ method, params }) {
        const manager = getLedgerManager()

        switch (method) {
          case "eth_accounts":
          case "eth_requestAccounts":
            return [address]

          case "personal_sign": {
            const [message, fromAddress] = params as [string, string]
            if (fromAddress.toLowerCase() !== address.toLowerCase()) {
              throw new Error("Address mismatch")
            }

            // Use real Ledger signing
            return await signRealMessage(message, onStatusUpdate)
          }

          case "eth_sendTransaction": {
            const [transaction] = params as [any]

            try {
              // In a real implementation, you would:
              // 1. Build the raw transaction
              // 2. Sign it with Ledger
              // 3. Broadcast to network

              onStatusUpdate?.("Please confirm transaction on your Ledger device...")

              // For now, we'll throw an error since transaction signing needs more implementation
              throw new Error("Transaction signing requires additional implementation")
            } catch (error) {
              throw error
            }
          }

          default:
            throw new Error(`Unsupported method: ${method}`)
        }
      },
    })

    const walletClient = createWalletClient({
      chain: mainnet,
      transport: customTransport,
    })

    return { walletClient, address: address as Address }
  } catch (error) {
    console.error("Failed to connect to Ledger device:", error)
    throw error
  }
}

// Disconnect real Ledger device
export const disconnectLedgerDevice = async (): Promise<void> => {
  await disconnectRealLedger()
}

// Sign welcome message with real Ledger
export const signWelcomeMessage = async (
  walletClient: WalletClient,
  address: string,
  onStatusUpdate?: (status: string) => void,
): Promise<string> => {
  const message = `Welcome to Pay-Peer-Roll! 🧻

Please sign this message to authenticate your access to the payroll distribution system.

Address: ${address}
Timestamp: ${new Date().toISOString()}
Nonce: ${Math.random().toString(36).substring(7)}

By signing this message, you confirm your identity and agree to access the Pay-Peer-Roll dashboard.

This signature will not trigger any blockchain transaction or cost any gas fees.`

  try {
    onStatusUpdate?.("Preparing message for signing...")

    const signature = await walletClient.signMessage({
      account: address as Address,
      message,
    })

    return signature
  } catch (error) {
    console.error("Failed to sign message:", error)
    throw error
  }
}

// Verify signature (unchanged)
export const verifySignature = async (
  message: string,
  signature: string,
  expectedAddress: string,
): Promise<boolean> => {
  try {
    const { recoverMessageAddress } = await import("viem")
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    })

    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
  } catch (error) {
    console.error("Failed to verify signature:", error)
    return false
  }
}

// Type declarations
declare global {
  interface Window {
    ethereum?: {
      isRabby?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
    }
  }

  interface Navigator {
    hid: {
      requestDevice(options: { filters: { vendorId: number }[] }): Promise<HIDDevice[]>
    }
  }

  interface HIDDevice {
    vendorId: number
    productId: number
    productName?: string
    opened: boolean
    open(): Promise<void>
    close(): Promise<void>
    sendReport(reportId: number, data: BufferSource): Promise<void>
    addEventListener(type: "inputreport", listener: (event: HIDInputReportEvent) => void): void
    removeEventListener(type: "inputreport", listener: (event: HIDInputReportEvent) => void): void
  }

  interface HIDInputReportEvent extends Event {
    data: DataView
    device: HIDDevice
    reportId: number
  }
}
