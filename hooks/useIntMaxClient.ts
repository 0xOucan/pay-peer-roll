import { useState, useCallback } from 'react'

// Type definition for IntMaxClient (for TypeScript)
type IntMaxClient = any

export interface TokenBalance {
  token: {
    tokenIndex: number
    symbol: string
    decimals: number
    contractAddress: string
    tokenType: number
    price: number
    image?: string
  }
  amount: bigint
  formattedBalance: string
}

export interface TransferRequest {
  recipients: Array<{
    address: string
    amount: string
  }>
  token: string
  tokenAddress?: string
}

export const useIntMaxClient = () => {
  const [client, setClient] = useState<IntMaxClient | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [clientAddress, setClientAddress] = useState<string>('')

  // Helper function to format BigInt balances to decimal strings
  const formatBalance = (amount: bigint, decimals: number): string => {
    if (!amount || amount === BigInt(0)) return '0'
    
    const divisor = BigInt('1' + '0'.repeat(decimals))
    const wholePart = amount / divisor
    const fractionalPart = amount % divisor
    
    if (fractionalPart === BigInt(0)) {
      return wholePart.toString()
    } else {
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const trimmedFractional = fractionalStr.replace(/0+$/, '')
      return trimmedFractional ? 
        `${wholePart}.${trimmedFractional}` : 
        wholePart.toString()
    }
  }

  const initializeClient = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Initializing INTMAX Client SDK...')
      
      // Dynamic import for client-side only
      const { IntMaxClient } = await import('intmax2-client-sdk')
      const newClient = await IntMaxClient.init({ 
        environment: 'testnet'
      })
      
      setClient(newClient)
      console.log('INTMAX Client SDK initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize client'
      setError(errorMessage)
      console.error('IntMax Client initialization failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async () => {
    if (!client) {
      setError('Client not initialized')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Logging in to INTMAX...')
      await client.login()
      
      setIsLoggedIn(true)
      setClientAddress(client.address)
      console.log('Login successful, address:', client.address)
      
      // Fetch initial balances
      await fetchBalances()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      console.error('Login failed:', err)
    } finally {
      setLoading(false)
    }
  }, [client])

  const logout = useCallback(async () => {
    if (!client) return
    
    try {
      setLoading(true)
      console.log('Logging out from INTMAX...')
      await client.logout()
      
      setIsLoggedIn(false)
      setClientAddress('')
      setBalances([])
      setError(null)
      console.log('Logout successful')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed'
      setError(errorMessage)
      console.error('Logout failed:', err)
    } finally {
      setLoading(false)
    }
  }, [client])

  const fetchBalances = useCallback(async () => {
    if (!client || !isLoggedIn) return
    
    try {
      console.log('Fetching token balances...')
      const { balances: rawBalances } = await client.fetchTokenBalances()
      
      const formattedBalances: TokenBalance[] = rawBalances.map((balance: any) => ({
        token: balance.token,
        amount: balance.amount,
        formattedBalance: formatBalance(balance.amount, balance.token.decimals || 18)
      }))
      
      setBalances(formattedBalances)
      console.log('Balances fetched successfully:', formattedBalances)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balances'
      setError(errorMessage)
      console.error('Failed to fetch balances:', err)
    }
  }, [client, isLoggedIn])

  const deposit = useCallback(async (amount: string, token: string, tokenAddress?: string) => {
    if (!client || !isLoggedIn) {
      setError('Client not initialized or not logged in')
      return null
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Initiating deposit: ${amount} ${token}`)
      
      // Get available tokens
      const tokens = await client.getTokensList()
      const balanceData = await client.fetchTokenBalances()
      
      // Find the target token
      let targetToken = null
      const balanceEntry = balanceData.balances.find((b: any) => {
        const balanceToken = b.token
        if (token === 'ETH') {
          return balanceToken.symbol === 'ETH' || 
                 balanceToken.tokenType === 0 ||
                 balanceToken.contractAddress === '0x0000000000000000000000000000000000000000'
        }
        if (token === 'USDC' && tokenAddress) {
          return balanceToken.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
        }
        return balanceToken.symbol?.toLowerCase() === token.toLowerCase()
      })
      
      if (balanceEntry) {
        targetToken = balanceEntry.token
      } else {
        targetToken = tokens.find((t: any) => {
          if (token === 'ETH') {
            return t.symbol === 'ETH' || 
                   t.tokenType === 0 || 
                   t.contractAddress === '0x0000000000000000000000000000000000000000'
          }
          if (token === 'USDC' && tokenAddress) {
            return t.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
          }
          return t.symbol?.toLowerCase() === token.toLowerCase()
        })
      }
      
      if (!targetToken) {
        throw new Error(`Token ${token} not found`)
      }
      
      const depositToken = {
        tokenType: targetToken.tokenType ?? (token === 'ETH' ? 0 : 1),
        tokenIndex: targetToken.tokenIndex || 0,
        decimals: targetToken.decimals || 18,
        contractAddress: targetToken.contractAddress || "0x0000000000000000000000000000000000000000",
        price: targetToken.price || 0
      }
      
      const depositParams = {
        amount: parseFloat(amount),
        token: depositToken,
        address: client.address,
        isMining: false
      }
      
      console.log('Estimating gas for deposit...')
      const gasEstimate = await client.estimateDepositGas({
        ...depositParams,
        isGasEstimation: true
      })
      console.log('Gas estimate:', gasEstimate.toString())
      
      console.log('Executing deposit...')
      const result = await client.deposit(depositParams)
      
      console.log('Deposit successful:', result)
      
      // Refresh balances after successful deposit
      await fetchBalances()
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deposit failed'
      setError(errorMessage)
      console.error('Deposit failed:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [client, isLoggedIn, fetchBalances])

  const withdraw = useCallback(async (amount: string, token: string, address: string, tokenAddress?: string) => {
    if (!client || !isLoggedIn) {
      setError('Client not initialized or not logged in')
      return null
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Initiating withdrawal: ${amount} ${token} to ${address}`)
      
      // Get available tokens
      const tokens = await client.getTokensList()
      const balanceData = await client.fetchTokenBalances()
      
      // Find the target token
      let targetToken = null
      const balanceEntry = balanceData.balances.find((b: any) => {
        const balanceToken = b.token
        if (token === 'ETH') {
          return balanceToken.symbol === 'ETH' || 
                 balanceToken.tokenType === 0 ||
                 balanceToken.contractAddress === '0x0000000000000000000000000000000000000000'
        }
        if (token === 'USDC' && tokenAddress) {
          return balanceToken.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
        }
        return balanceToken.symbol?.toLowerCase() === token.toLowerCase()
      })
      
      if (balanceEntry) {
        targetToken = balanceEntry.token
      } else {
        targetToken = tokens.find((t: any) => {
          if (token === 'ETH') {
            return t.symbol === 'ETH' || 
                   t.tokenType === 0 || 
                   t.contractAddress === '0x0000000000000000000000000000000000000000'
          }
          if (token === 'USDC' && tokenAddress) {
            return t.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
          }
          return t.symbol?.toLowerCase() === token.toLowerCase()
        })
      }
      
      if (!targetToken) {
        throw new Error(`Token ${token} not found`)
      }
      
      const withdrawToken = {
        tokenType: targetToken.tokenType ?? (token === 'ETH' ? 0 : 1),
        tokenIndex: targetToken.tokenIndex || 0,
        decimals: targetToken.decimals || 18,
        contractAddress: targetToken.contractAddress || "0x0000000000000000000000000000000000000000",
        price: targetToken.price || 0
      }
      
      const withdrawParams = {
        amount: parseFloat(amount),
        token: withdrawToken,
        address: address as `0x${string}`
      }
      
      console.log('Executing withdrawal...')
      const result = await client.withdraw(withdrawParams)
      
      console.log('Withdrawal successful:', result)
      
      // Refresh balances after successful withdrawal
      await fetchBalances()
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed'
      setError(errorMessage)
      console.error('Withdrawal failed:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [client, isLoggedIn, fetchBalances])

  const transfer = useCallback(async (transferRequest: TransferRequest) => {
    if (!client || !isLoggedIn) {
      setError('Client not initialized or not logged in')
      return null
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const { recipients, token, tokenAddress } = transferRequest
      console.log(`Initiating INTMAX transfer: ${recipients.length} recipients for ${token}`)
      
      // Get available tokens
      const tokens = await client.getTokensList()
      const balanceData = await client.fetchTokenBalances()
      
      // Find the target token
      let targetToken = null
      const balanceEntry = balanceData.balances.find((b: any) => {
        const balanceToken = b.token
        if (token === 'ETH') {
          return balanceToken.symbol === 'ETH' || 
                 balanceToken.tokenType === 0 ||
                 balanceToken.contractAddress === '0x0000000000000000000000000000000000000000'
        }
        if (token === 'USDC' && tokenAddress) {
          return balanceToken.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
        }
        return balanceToken.symbol?.toLowerCase() === token.toLowerCase()
      })
      
      if (balanceEntry) {
        targetToken = balanceEntry.token
      } else {
        targetToken = tokens.find((t: any) => {
          if (token === 'ETH') {
            return t.symbol === 'ETH' || 
                   t.tokenType === 0 || 
                   t.contractAddress === '0x0000000000000000000000000000000000000000'
          }
          if (token === 'USDC' && tokenAddress) {
            return t.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
          }
          return t.symbol?.toLowerCase() === token.toLowerCase()
        })
      }
      
      if (!targetToken) {
        throw new Error(`Token ${token} not found`)
      }
      
      const transferToken = {
        tokenType: targetToken.tokenType ?? (token === 'ETH' ? 0 : 1),
        tokenIndex: targetToken.tokenIndex || 0,
        decimals: targetToken.decimals || 18,
        contractAddress: targetToken.contractAddress || "0x0000000000000000000000000000000000000000",
        price: targetToken.price || 0
      }
      
      const broadcastRequests = recipients.map(recipient => ({
        address: recipient.address,
        amount: parseFloat(recipient.amount),
        token: transferToken
      }))
      
      console.log('Broadcasting transactions:', broadcastRequests)
      const result = await client.broadcastTransaction(broadcastRequests, false)
      
      console.log('INTMAX transfer successful:', result)
      
      // Refresh balances after successful transfer
      await fetchBalances()
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed'
      setError(errorMessage)
      console.error('Transfer failed:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [client, isLoggedIn, fetchBalances])

  return {
    client,
    isLoggedIn,
    loading,
    error,
    balances,
    clientAddress,
    initializeClient,
    login,
    logout,
    fetchBalances,
    deposit,
    withdraw,
    transfer,
    setError
  }
} 