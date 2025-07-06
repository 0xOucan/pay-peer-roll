// Session management for INTMAX client
let globalClient: any = null
let loginPromise: Promise<any> | null = null

/**
 * Get or create INTMAX client with session management
 */
export async function getIntmaxClient() {
  if (globalClient && globalClient.isLoggedIn) {
    return globalClient
  }

  // If login is already in progress, wait for it
  if (loginPromise) {
    await loginPromise
    return globalClient
  }

  // Start login process
  loginPromise = initializeClient()
  
  try {
    globalClient = await loginPromise
    return globalClient
  } finally {
    loginPromise = null
  }
}

async function initializeClient() {
  if (!process.env.ETH_PRIVATE_KEY || !process.env.L1_RPC_URL) {
    throw new Error('Missing required environment variables: ETH_PRIVATE_KEY and L1_RPC_URL')
  }

  const { IntMaxNodeClient } = await import('intmax2-server-sdk')
  
  const client = new IntMaxNodeClient({
    environment: 'testnet',
    eth_private_key: process.env.ETH_PRIVATE_KEY as `0x${string}`,
    l1_rpc_url: process.env.L1_RPC_URL,
  })

  console.log('Initializing INTMAX client...')
  await client.login()
  console.log('INTMAX client logged in successfully')
  
  return client
}

/**
 * Clear the global client session
 */
export async function clearIntmaxSession() {
  if (globalClient) {
    try {
      await globalClient.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
    globalClient = null
  }
  loginPromise = null
} 