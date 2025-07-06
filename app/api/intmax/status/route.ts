import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

export async function GET(request: NextRequest) {
  try {
    console.log('=== INTMAX STATUS CHECK ===')
    const client = await getIntmaxClient()
    
    const status = {
      timestamp: new Date().toISOString(),
      client: {
        address: client.address,
        isLoggedIn: client.isLoggedIn,
        status: 'connected'
      },
      tokens: {
        available: 0,
        ethFound: false,
        usdcFound: false,
        status: 'unknown'
      },
      balances: {
        count: 0,
        ethBalance: '0',
        status: 'unknown'
      },
      deposit: {
        gasEstimation: 'unknown',
        functionality: 'unknown',
        lastError: null as string | null,
        status: 'unknown'
      },
      testnet: {
        limitations: [] as string[],
        recommendations: [] as string[],
        status: 'unknown'
      }
    }
    
    // Test tokens list
    try {
      const tokens = await client.getTokensList()
      status.tokens.available = tokens.length
      status.tokens.ethFound = tokens.some((t: any) => t.symbol === 'ETH')
      status.tokens.usdcFound = tokens.some((t: any) => t.symbol === 'USDC')
      status.tokens.status = 'success'
      console.log('Tokens check: SUCCESS')
    } catch (tokensError) {
      status.tokens.status = 'error'
      console.log('Tokens check: ERROR', tokensError)
    }
    
    // Test balances
    try {
      const { balances } = await client.fetchTokenBalances()
      status.balances.count = balances.length
      const ethBalance = balances.find((b: any) => b.token.symbol === 'ETH')
      if (ethBalance) {
        status.balances.ethBalance = ethBalance.amount.toString()
      }
      status.balances.status = 'success'
      console.log('Balances check: SUCCESS')
    } catch (balancesError) {
      status.balances.status = 'error'
      console.log('Balances check: ERROR', balancesError)
    }
    
    // Test deposit gas estimation (without actual deposit)
    if (status.tokens.ethFound) {
      try {
        const tokens = await client.getTokensList()
        const ethToken = tokens.find((t: any) => t.symbol === 'ETH')
        
        if (ethToken) {
          const depositToken = {
            tokenType: ethToken.tokenType ?? 0,
            tokenIndex: ethToken.tokenIndex,
            decimals: ethToken.decimals,
            contractAddress: ethToken.contractAddress,
            price: ethToken.price || 0
          }
          
          const testDepositParams = {
            amount: 0.001, // Small test amount
            token: depositToken,
            address: client.address,
            isMining: false
          }
          
          const gasEstimate = await client.estimateDepositGas({
            ...testDepositParams,
            isGasEstimation: true
          })
          
          status.deposit.gasEstimation = gasEstimate.toString()
          status.deposit.functionality = 'gas_estimation_works'
          status.deposit.status = 'partial' // Gas works, but actual deposit may fail
          console.log('Deposit gas estimation: SUCCESS')
        }
      } catch (depositError) {
        const errorMessage = depositError instanceof Error ? depositError.message : 'Unknown error'
        status.deposit.lastError = errorMessage
        status.deposit.status = 'error'
        console.log('Deposit gas estimation: ERROR', errorMessage)
      }
    }
    
    // Analyze testnet limitations
    if (status.deposit.lastError) {
      if (status.deposit.lastError.includes('Transfer-Encoding')) {
        status.testnet.limitations.push('Transfer-Encoding header not supported')
        status.testnet.recommendations.push('This is a known INTMAX testnet server limitation')
      }
      if (status.deposit.lastError.includes('AccessDenied')) {
        status.testnet.limitations.push('Access denied by server')
        status.testnet.recommendations.push('Check INTMAX testnet status and try again later')
      }
    }
    
    // Overall testnet status
    if (status.tokens.status === 'success' && status.balances.status === 'success') {
      if (status.deposit.status === 'partial') {
        status.testnet.status = 'limited_functionality'
        status.testnet.recommendations.push('Core functions work, but deposits have server-side limitations')
      } else if (status.deposit.status === 'error') {
        status.testnet.status = 'deposit_issues'
        status.testnet.recommendations.push('Deposit functionality is currently limited by testnet infrastructure')
      } else {
        status.testnet.status = 'operational'
      }
    } else {
      status.testnet.status = 'connection_issues'
    }
    
    console.log('=== STATUS CHECK COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      status: status,
      summary: {
        overall: status.testnet.status,
        clientConnection: status.client.status,
        dataAccess: status.tokens.status === 'success' && status.balances.status === 'success' ? 'working' : 'issues',
        depositFunctionality: status.deposit.status,
        mainIssues: status.testnet.limitations,
        recommendations: status.testnet.recommendations
      }
    })
  } catch (error) {
    console.error('INTMAX status check error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 