/**
 * Create INTMAX client instance
 */
export async function createIntmaxClient() {
  if (!process.env.ETH_PRIVATE_KEY || !process.env.L1_RPC_URL) {
    throw new Error('Missing required environment variables: ETH_PRIVATE_KEY and L1_RPC_URL')
  }

  const { IntMaxNodeClient } = await import('intmax2-server-sdk')
  
  return new IntMaxNodeClient({
    environment: 'testnet',
    eth_private_key: process.env.ETH_PRIVATE_KEY as `0x${string}`,
    l1_rpc_url: process.env.L1_RPC_URL,
  })
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string | number, decimals: number = 18): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(Math.min(6, decimals))
}

/**
 * Token configuration for supported tokens
 */
export const SUPPORTED_TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: null, // Native token
    icon: '⚡'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    icon: '💵'
  }
} as const

export type SupportedToken = keyof typeof SUPPORTED_TOKENS

/**
 * Get token configuration
 */
export function getTokenConfig(token: SupportedToken) {
  return SUPPORTED_TOKENS[token]
}

/**
 * Generate mock transaction hash for testing
 */
export function generateMockTxHash(): string {
  return `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
} 