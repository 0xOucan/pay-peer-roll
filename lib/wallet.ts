import { createWalletClient, custom, type WalletClient, type Address } from "viem"
import { mainnet } from "viem/chains"
import { 
  connectToLedger, 
  signMessageWithLedger, 
  disconnectLedger, 
  handleLedgerError,
  diagnosticDeviceState,
  testLedgerSetup 
} from "./ledger-integration"

// Welcome message for Pay-Peer-Roll app
const WELCOME_MESSAGE = "Welcome to Pay-Peer-Roll App 🧻💸 Private payrolls, crystal-clear approvals."

// Simple fallback message without emojis for testing
const SIMPLE_WELCOME_MESSAGE = "Welcome to Pay-Peer-Roll App"

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
    console.error("Error connecting to Rabby wallet:", error)
    throw error
  }
}

// Ledger wallet connection using Device Management Kit
export const connectLedgerDevice = async (
  onStatusUpdate?: (status: string) => void
): Promise<{ address: Address; sessionId: string }> => {
  try {
    const result = await connectToLedger(onStatusUpdate)
    return {
      address: result.address as Address,
      sessionId: result.sessionId
    }
  } catch (error) {
    console.error("Error connecting to Ledger device:", error)
    const friendlyMessage = handleLedgerError(error)
    throw new Error(friendlyMessage)
  }
}

// Disconnect Ledger device
export const disconnectLedgerDevice = async (): Promise<void> => {
  try {
    await disconnectLedger()
  } catch (error) {
    console.error("Error disconnecting from Ledger device:", error)
    throw error
  }
}

// Sign welcome message with Rabby wallet
export const signWelcomeMessageWithRabby = async (
  walletClient: WalletClient,
  address: Address
): Promise<string> => {
  try {
    const signature = await walletClient.signMessage({
      account: address,
      message: WELCOME_MESSAGE,
    })
    return signature
  } catch (error) {
    console.error("Error signing message with Rabby wallet:", error)
    throw error
  }
}

// Sign welcome message with Ledger device
export const signWelcomeMessageWithLedger = async (
  derivationPath: string = "44'/60'/0'/0/0",
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  try {
    const signature = await signMessageWithLedger(
      WELCOME_MESSAGE,
      derivationPath,
      onStatusUpdate
    )
    return signature
  } catch (error) {
    console.error("Error signing message with Ledger device:", error)
    const friendlyMessage = handleLedgerError(error)
    throw new Error(friendlyMessage)
  }
}

// Generic sign welcome message function
export const signWelcomeMessage = async (
  walletType: "rabby" | "ledger",
  walletClient?: WalletClient,
  address?: Address,
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  if (walletType === "rabby") {
    if (!walletClient || !address) {
      throw new Error("Wallet client and address are required for Rabby wallet")
    }
    return signWelcomeMessageWithRabby(walletClient, address)
  } else if (walletType === "ledger") {
    return signWelcomeMessageWithLedger(undefined, onStatusUpdate)
  } else {
    throw new Error("Unsupported wallet type")
  }
}

// Diagnostic function for debugging
export const getLedgerDiagnostics = async () => {
  return await diagnosticDeviceState()
}

// Test function for debugging
export const testLedgerConnection = async () => {
  return await testLedgerSetup()
}

// Test signing with simple message
export const testSimpleLedgerSigning = async (
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  try {
    const signature = await signMessageWithLedger(
      SIMPLE_WELCOME_MESSAGE,
      "44'/60'/0'/0/0",
      onStatusUpdate
    )
    return signature
  } catch (error) {
    console.error("Error signing simple message with Ledger device:", error)
    const friendlyMessage = handleLedgerError(error)
    throw new Error(friendlyMessage)
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
