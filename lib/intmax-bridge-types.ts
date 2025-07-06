/**
 * EIP-712 Typed Data structures for INTMAX Bridge transactions
 * Based on: https://eips.ethereum.org/EIPS/eip-712
 * Contract: https://sepolia.etherscan.io/address/0x81f3843af1fbab046b771f0d440c04ebb2b7513f
 */

// INTMAX Bridge contract address on Sepolia
export const INTMAX_BRIDGE_CONTRACT = "0x81f3843af1fbab046b771f0d440c04ebb2b7513f"

// EIP-712 Domain for INTMAX Bridge
export interface IntmaxBridgeDomain {
  name: string
  version: string
  chainId: number
  verifyingContract: string
}

// EIP-712 Types for INTMAX Bridge
export const INTMAX_BRIDGE_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  DepositNativeToken: [
    { name: 'recipientSaltHash', type: 'bytes32' },
    { name: 'amlPermission', type: 'bytes' },
    { name: 'eligibilityPermission', type: 'bytes' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
} as const

// Domain for INTMAX Bridge on Sepolia
export const INTMAX_BRIDGE_DOMAIN: IntmaxBridgeDomain = {
  name: "INTMAX Bridge",
  version: "1",
  chainId: 11155111, // Sepolia chain ID
  verifyingContract: INTMAX_BRIDGE_CONTRACT
}

// Deposit Native Token Message Structure
export interface DepositNativeTokenMessage {
  recipientSaltHash: string // bytes32
  amlPermission: string // bytes
  eligibilityPermission: string // bytes
  amount: string // uint256 (in wei)
  nonce: string // uint256
  deadline: string // uint256 (timestamp)
}

// Complete EIP-712 Typed Data for INTMAX Bridge
export interface IntmaxBridgeTypedData {
  domain: IntmaxBridgeDomain
  types: typeof INTMAX_BRIDGE_TYPES
  primaryType: 'DepositNativeToken'
  message: DepositNativeTokenMessage
}

// Helper function to create typed data for deposit
export function createDepositTypedData(
  recipientSaltHash: string,
  amlPermission: string,
  eligibilityPermission: string,
  amount: string,
  nonce: string,
  deadline?: number
): IntmaxBridgeTypedData {
  const deadlineTimestamp = deadline || Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  
  return {
    domain: INTMAX_BRIDGE_DOMAIN,
    types: INTMAX_BRIDGE_TYPES,
    primaryType: 'DepositNativeToken',
    message: {
      recipientSaltHash,
      amlPermission,
      eligibilityPermission,
      amount,
      nonce,
      deadline: deadlineTimestamp.toString()
    }
  }
}

// Parse transaction data from the example transaction
export function parseTransactionData(txData: string): {
  recipientSaltHash: string
  amlPermission: string
  eligibilityPermission: string
} {
  // Remove 0x prefix and method ID (first 4 bytes)
  const data = txData.startsWith('0x') ? txData.slice(10) : txData.slice(8)
  
  // Parse the transaction data based on the example
  // [0]: recipientSaltHash (bytes32)
  const recipientSaltHash = '0x' + data.slice(0, 64)
  
  // [1] and [2] are offsets for dynamic data (amlPermission and eligibilityPermission)
  // We'll need to parse these based on the actual transaction structure
  
  return {
    recipientSaltHash,
    amlPermission: '0x', // Will be populated from actual transaction
    eligibilityPermission: '0x' // Will be populated from actual transaction
  }
}

// Generate mock data for testing
export function generateMockDepositData(): IntmaxBridgeTypedData {
  return createDepositTypedData(
    '0x5fa0d446d07aefdec7ff6a02fd2e513a076198a2d334cd37722dced0bc52c7f9', // Example recipient salt hash
    '0x0000000000000000000000000000000000000000000000000000000000000020', // Mock AML permission
    '0x0000000000000000000000000000000000000000000000000000000000000041', // Mock eligibility permission
    '1000000000000000000', // 1 ETH in wei
    '1', // Nonce
    Math.floor(Date.now() / 1000) + 3600 // 1 hour deadline
  )
}

// Validate typed data structure
export function validateTypedData(typedData: IntmaxBridgeTypedData): boolean {
  try {
    // Check domain
    if (!typedData.domain.name || !typedData.domain.verifyingContract) {
      return false
    }
    
    // Check types
    if (!typedData.types.DepositNativeToken || !typedData.types.EIP712Domain) {
      return false
    }
    
    // Check message
    const message = typedData.message
    if (!message.recipientSaltHash || !message.amount || !message.nonce) {
      return false
    }
    
    // Validate hex strings
    if (!message.recipientSaltHash.startsWith('0x') || message.recipientSaltHash.length !== 66) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Typed data validation error:', error)
    return false
  }
}

// Format typed data for display
export function formatTypedDataForDisplay(typedData: IntmaxBridgeTypedData): {
  domain: Record<string, string>
  message: Record<string, string>
} {
  return {
    domain: {
      'Contract Name': typedData.domain.name,
      'Version': typedData.domain.version,
      'Chain ID': typedData.domain.chainId.toString(),
      'Contract Address': typedData.domain.verifyingContract
    },
    message: {
      'Recipient Salt Hash': typedData.message.recipientSaltHash,
      'Amount (ETH)': (parseFloat(typedData.message.amount) / 1e18).toString(),
      'Nonce': typedData.message.nonce,
      'Deadline': new Date(parseInt(typedData.message.deadline) * 1000).toLocaleString(),
      'AML Permission': typedData.message.amlPermission.slice(0, 20) + '...',
      'Eligibility Permission': typedData.message.eligibilityPermission.slice(0, 20) + '...'
    }
  }
} 