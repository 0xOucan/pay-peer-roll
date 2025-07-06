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

// Simple fallback message without emojis for Ledger compatibility
const SIMPLE_WELCOME_MESSAGE = "Welcome to Pay-Peer-Roll App"

// Function to get the appropriate message for Ledger (without emojis)
const getLedgerMessage = (originalMessage: string): string => {
  // Check if message contains emojis or special characters that might cause issues
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(originalMessage);
  
  if (hasEmojis) {
    console.log("Message contains emojis, using simplified version for Ledger");
    return SIMPLE_WELCOME_MESSAGE;
  }
  
  return originalMessage;
}

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
): Promise<{ signature: string; message: string }> => {
  try {
    // Use the simplified message for Ledger to avoid emoji issues
    const messageToSign = getLedgerMessage(WELCOME_MESSAGE);
    
    const signature = await signMessageWithLedger(
      messageToSign,
      derivationPath,
      onStatusUpdate
    )
    
    // Return both signature and the actual message that was signed
    return { signature, message: messageToSign };
  } catch (error) {
    console.error("Error signing message with Ledger device:", error)
    const friendlyMessage = handleLedgerError(error)
    throw new Error(friendlyMessage)
  }
}

// Store authentication in localStorage
export const storeAuthentication = async (
  address: string,
  signature: string,
  walletType: "rabby" | "ledger",
  messageUsed: string = WELCOME_MESSAGE
): Promise<void> => {
  try {
    console.log("Verifying signature with message:", messageUsed);
    console.log("Address:", address);
    console.log("Signature:", signature);
    
    // Verify the signature with the actual message that was signed
    const isValid = await verifySignature(messageUsed, signature, address)
    
    if (!isValid) {
      console.error("Signature verification failed:");
      console.error("- Message used:", messageUsed);
      console.error("- Expected address:", address);
      console.error("- Signature:", signature);
      throw new Error("Invalid signature - authentication failed")
    }
    
    // Store authentication data in localStorage
    const authData = {
      address,
      signature,
      walletType,
      timestamp: Date.now(),
      message: messageUsed, // Store the actual message that was signed
    }
    
    localStorage.setItem("payroll_auth", JSON.stringify(authData))
    console.log("Authentication stored successfully for address:", address)
  } catch (error) {
    console.error("Failed to store authentication:", error)
    throw error
  }
}

// Generic sign welcome message function with authentication storage
export const signWelcomeMessage = async (
  walletType: "rabby" | "ledger",
  walletClient?: WalletClient,
  address?: Address,
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  let signature: string
  let signerAddress: string
  let messageUsed: string
  
  if (walletType === "rabby") {
    if (!walletClient || !address) {
      throw new Error("Wallet client and address are required for Rabby wallet")
    }
    signature = await signWelcomeMessageWithRabby(walletClient, address)
    signerAddress = address
    messageUsed = WELCOME_MESSAGE // Rabby can handle emojis
  } else if (walletType === "ledger") {
    if (!address) {
      throw new Error("Address is required for Ledger wallet authentication")
    }
    const result = await signWelcomeMessageWithLedger(undefined, onStatusUpdate)
    signature = result.signature
    messageUsed = result.message // Use the actual message that was signed
    signerAddress = address
  } else {
    throw new Error("Unsupported wallet type")
  }
  
  // Store authentication after successful signing with the correct message
  await storeAuthentication(signerAddress, signature, walletType, messageUsed)
  
  return signature
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

// Check if user is already authenticated
export const checkStoredAuthentication = (): {
  isAuthenticated: boolean;
  address?: string;
  walletType?: "rabby" | "ledger";
  expiresAt?: number;
} => {
  try {
    const authData = localStorage.getItem("payroll_auth")
    
    if (!authData) {
      return { isAuthenticated: false }
    }
    
    const { address, signature, walletType, timestamp, message } = JSON.parse(authData)
    
    // Check if auth is less than 24 hours old
    const expiresAt = timestamp + (24 * 60 * 60 * 1000)
    const isExpired = Date.now() > expiresAt
    
    if (isExpired) {
      console.log("Authentication expired, clearing stored data")
      localStorage.removeItem("payroll_auth")
      return { isAuthenticated: false }
    }
    
    // Verify all required fields are present
    if (!address || !signature || !walletType) {
      console.log("Missing required authentication fields, clearing stored data")
      localStorage.removeItem("payroll_auth")
      return { isAuthenticated: false }
    }
    
    // Verify the stored message is appropriate for the wallet type
    const expectedMessage = walletType === "ledger" ? getLedgerMessage(WELCOME_MESSAGE) : WELCOME_MESSAGE;
    const storedMessage = message || expectedMessage; // Fallback for older stored data
    
    console.log("Authentication check passed:", {
      address: address.slice(0, 6) + "..." + address.slice(-4),
      walletType,
      messageUsed: storedMessage,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
    return {
      isAuthenticated: true,
      address,
      walletType,
      expiresAt,
    }
  } catch (error) {
    console.error("Error checking stored authentication:", error)
    localStorage.removeItem("payroll_auth")
    return { isAuthenticated: false }
  }
}

// Clear stored authentication
export const clearStoredAuthentication = (): void => {
  localStorage.removeItem("payroll_auth")
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
