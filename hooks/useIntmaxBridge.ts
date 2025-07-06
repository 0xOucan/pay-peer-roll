import { useState, useCallback } from 'react'
import { 
  IntmaxBridgeTypedData, 
  createDepositTypedData, 
  generateMockDepositData,
  validateTypedData,
  formatTypedDataForDisplay,
  INTMAX_BRIDGE_CONTRACT
} from '@/lib/intmax-bridge-types'
import { 
  connectToLedger, 
  connectLedgerWithGuidance,
  signTypedDataWithLedger, 
  disconnectLedger, 
  isLedgerConnected,
  handleLedgerError 
} from '@/lib/ledger-integration'

export interface BridgeTransaction {
  id: string
  typedData: IntmaxBridgeTypedData
  signature?: {
    r: string
    s: string
    v: number
  }
  status: 'pending' | 'signed' | 'submitted' | 'confirmed' | 'failed'
  txHash?: string
  timestamp: number
}

export interface UseBridgeState {
  // Connection state
  isConnected: boolean
  ledgerAddress: string | null
  sessionId: string | null
  
  // Transaction state
  currentTransaction: BridgeTransaction | null
  transactionHistory: BridgeTransaction[]
  
  // UI state
  loading: boolean
  error: string | null
  status: string | null
}

export function useIntmaxBridge() {
  const [state, setState] = useState<UseBridgeState>({
    isConnected: false,
    ledgerAddress: null,
    sessionId: null,
    currentTransaction: null,
    transactionHistory: [],
    loading: false,
    error: null,
    status: null,
  })

  // Update state helper
  const updateState = useCallback((updates: Partial<UseBridgeState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Clear error and status
  const clearMessages = useCallback(() => {
    updateState({ error: null, status: null })
  }, [updateState])

  // Connect to Ledger device
  const connectLedger = useCallback(async () => {
    try {
      updateState({ loading: true, error: null })
      
      const result = await connectLedgerWithGuidance((status) => {
        updateState({ status })
      })
      
      updateState({
        isConnected: true,
        ledgerAddress: result.address,
        sessionId: result.sessionId,
        status: 'Ledger connected successfully!'
      })
      
      return result
    } catch (error) {
      const errorMessage = handleLedgerError(error)
      updateState({ error: errorMessage, isConnected: false })
      throw error
    } finally {
      updateState({ loading: false })
    }
  }, [updateState])

  // Disconnect from Ledger device
  const disconnectLedgerDevice = useCallback(async () => {
    try {
      await disconnectLedger()
      updateState({
        isConnected: false,
        ledgerAddress: null,
        sessionId: null,
        currentTransaction: null,
        status: 'Ledger disconnected'
      })
    } catch (error) {
      console.error('Error disconnecting Ledger:', error)
    }
  }, [updateState])

  // Create a new bridge transaction
  const createBridgeTransaction = useCallback((
    recipientSaltHash: string,
    amount: string,
    amlPermission?: string,
    eligibilityPermission?: string,
    nonce?: string
  ): BridgeTransaction => {
    const typedData = createDepositTypedData(
      recipientSaltHash,
      amlPermission || '0x0000000000000000000000000000000000000000000000000000000000000020',
      eligibilityPermission || '0x0000000000000000000000000000000000000000000000000000000000000041',
      amount,
      nonce || '1'
    )

    const transaction: BridgeTransaction = {
      id: `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      typedData,
      status: 'pending',
      timestamp: Date.now()
    }

    updateState({ currentTransaction: transaction })
    return transaction
  }, [updateState])

  // Create mock transaction for testing
  const createMockTransaction = useCallback((): BridgeTransaction => {
    const typedData = generateMockDepositData()
    
    const transaction: BridgeTransaction = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      typedData,
      status: 'pending',
      timestamp: Date.now()
    }

    updateState({ currentTransaction: transaction })
    return transaction
  }, [updateState])

  // Sign typed data with Ledger
  const signWithLedger = useCallback(async (transaction?: BridgeTransaction) => {
    const txToSign = transaction || state.currentTransaction
    
    if (!txToSign) {
      throw new Error('No transaction to sign')
    }

    if (!state.isConnected) {
      throw new Error('Ledger not connected')
    }

    try {
      updateState({ loading: true, error: null })

      // Validate typed data before signing
      if (!validateTypedData(txToSign.typedData)) {
        throw new Error('Invalid typed data structure')
      }

      const signature = await signTypedDataWithLedger(
        txToSign.typedData,
        "44'/60'/0'/0/0",
        (status) => {
          updateState({ status })
        }
      )

      const signedTransaction: BridgeTransaction = {
        ...txToSign,
        signature,
        status: 'signed'
      }

      updateState({
        currentTransaction: signedTransaction,
        transactionHistory: [...state.transactionHistory, signedTransaction],
        status: 'Transaction signed successfully!'
      })

      return signedTransaction
    } catch (error) {
      const errorMessage = handleLedgerError(error)
      updateState({ error: errorMessage })
      
      // Update transaction status to failed
      if (txToSign) {
        const failedTransaction: BridgeTransaction = {
          ...txToSign,
          status: 'failed'
        }
        updateState({ currentTransaction: failedTransaction })
      }
      
      throw error
    } finally {
      updateState({ loading: false })
    }
  }, [state.currentTransaction, state.isConnected, state.transactionHistory, updateState])

  // Submit transaction to blockchain (mock implementation)
  const submitTransaction = useCallback(async (transaction?: BridgeTransaction) => {
    const txToSubmit = transaction || state.currentTransaction
    
    if (!txToSubmit || !txToSubmit.signature) {
      throw new Error('No signed transaction to submit')
    }

    try {
      updateState({ loading: true, error: null, status: 'Submitting transaction...' })

      // Mock transaction submission - in production, this would call the actual contract
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockTxHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`
      
      const submittedTransaction: BridgeTransaction = {
        ...txToSubmit,
        status: 'submitted',
        txHash: mockTxHash
      }

      updateState({
        currentTransaction: submittedTransaction,
        status: `Transaction submitted! Hash: ${mockTxHash}`
      })

      return submittedTransaction
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction submission failed'
      updateState({ error: errorMessage })
      throw error
    } finally {
      updateState({ loading: false })
    }
  }, [state.currentTransaction, updateState])

  // Get formatted transaction data for display
  const getTransactionDisplay = useCallback((transaction?: BridgeTransaction) => {
    const tx = transaction || state.currentTransaction
    if (!tx) return null

    return formatTypedDataForDisplay(tx.typedData)
  }, [state.currentTransaction])

  // Check connection status
  const checkConnection = useCallback(() => {
    const connected = isLedgerConnected()
    if (connected !== state.isConnected) {
      updateState({ isConnected: connected })
    }
    return connected
  }, [state.isConnected, updateState])

  // Clear current transaction
  const clearTransaction = useCallback(() => {
    updateState({ currentTransaction: null })
  }, [updateState])

  return {
    // State
    ...state,
    
    // Actions
    connectLedger,
    disconnectLedger: disconnectLedgerDevice,
    createBridgeTransaction,
    createMockTransaction,
    signWithLedger,
    submitTransaction,
    clearTransaction,
    clearMessages,
    checkConnection,
    
    // Helpers
    getTransactionDisplay,
    
    // Constants
    bridgeContract: INTMAX_BRIDGE_CONTRACT
  }
} 