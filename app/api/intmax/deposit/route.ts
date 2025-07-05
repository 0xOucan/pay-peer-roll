import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, token, tokenAddress } = body

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token type is required' },
        { status: 400 }
      )
    }

    console.log(`Initiating deposit: ${amount} ${token}`)
    const client = await getIntmaxClient()
    
    // Get both tokens list and balances for complete token information
    const [tokens, { balances }] = await Promise.all([
      client.getTokensList(),
      client.fetchTokenBalances()
    ])
    
    console.log('Available tokens:', tokens)
    console.log('Available balances:', balances)
    console.log('Looking for token:', token)
    
    // Find the token by symbol, preferring balance data which has complete tokenType info
    let targetToken = null
    
    // First, try to find in balances (has complete token info including tokenType)
    const balanceEntry = balances.find((b: any) => {
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
      console.log('Found token in balances:', targetToken)
    } else {
      // Fallback to tokens list
      targetToken = tokens.find((t: any) => {
        console.log('Checking token from list:', { symbol: t.symbol, tokenType: t.tokenType, contractAddress: t.contractAddress })
        
        if (token === 'ETH') {
          return (
            (t.symbol === 'ETH' || t.symbol === 'eth') ||
            (t.contractAddress === '0x0000000000000000000000000000000000000000')
          )
        }
        
        if (token === 'USDC' && tokenAddress) {
          return t.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
        }
        
        return t.symbol?.toLowerCase() === token.toLowerCase()
      })
      
      if (targetToken) {
        console.log('Found token in tokens list:', targetToken)
      }
    }
    
    if (!targetToken) {
      console.log('Token not found. Available tokens:', tokens.map((t: any) => ({ 
        symbol: t.symbol, 
        tokenType: t.tokenType, 
        contractAddress: t.contractAddress 
      })))
      console.log('Available balances:', balances.map((b: any) => ({
        symbol: b.token.symbol,
        tokenType: b.token.tokenType,
        contractAddress: b.token.contractAddress
      })))
      return NextResponse.json(
        { 
          error: `Token ${token} not found in available tokens list`,
          availableTokens: tokens.map((t: any) => t.symbol).filter(Boolean),
          availableBalances: balances.map((b: any) => b.token.symbol).filter(Boolean)
        },
        { status: 400 }
      )
    }
    
    console.log('Using token:', targetToken)
    
    // Prepare token object according to INTMAX SDK requirements
    const depositToken = {
      tokenType: targetToken.tokenType ?? (token === 'ETH' ? 0 : 1), // Default to 0 for ETH, 1 for ERC20
      tokenIndex: targetToken.tokenIndex,
      decimals: targetToken.decimals,
      contractAddress: targetToken.contractAddress,
      price: targetToken.price || 0
    }
    
    const amountFloat = parseFloat(amount)
    
    const depositParams = {
      amount: amountFloat, // Use decimal amount as per SDK docs
      token: depositToken,
      address: client.address,
      isMining: false
    }
    
    console.log('Deposit parameters:', depositParams)
    
    let depositResult: any
    
    try {
      // First, estimate gas as recommended in the SDK docs
      console.log('Estimating gas for deposit...')
      const gasEstimate = await client.estimateDepositGas({
        ...depositParams,
        isGasEstimation: true
      })
      console.log('Gas estimate:', gasEstimate.toString())
      
      // Check if gas estimate is reasonable (not too high)
      const gasEstimateNum = Number(gasEstimate)
      if (gasEstimateNum > 10000000000000) { // 10 trillion gas limit
        console.log('Gas estimate too high, may indicate network issues')
        return NextResponse.json(
          { 
            error: 'Gas estimate is unusually high, indicating potential network issues.',
            details: 'This may be due to INTMAX testnet limitations or network congestion. Please try again later.',
            gasEstimate: gasEstimate.toString(),
            status: 'high_gas_estimate'
          },
          { status: 503 }
        )
      }
      
      // Proceed with deposit
      console.log('Executing deposit...')
      depositResult = await client.deposit(depositParams)
      console.log('Deposit successful:', depositResult)
    } catch (depositError) {
      console.error('Deposit failed:', depositError)
      
      // Check if it's a known issue and provide helpful error message
      const errorMessage = depositError instanceof Error ? depositError.message : 'Unknown deposit error'
      
      if (errorMessage.includes('Transfer-Encoding') || errorMessage.includes('NotImplemented')) {
        return NextResponse.json(
          { 
            error: 'INTMAX testnet deposit restrictions detected.',
            details: 'The INTMAX testnet currently has limitations on deposit operations. This is a known server-side issue with the Transfer-Encoding header.',
            technicalError: errorMessage,
            status: 'testnet_limitation',
            recommendation: 'Your client setup is correct. The issue is with the INTMAX testnet infrastructure. Please monitor INTMAX status updates or try again later.',
            gasEstimate: depositParams.amount ? 'Gas estimation was successful' : 'Gas estimation failed'
          },
          { status: 503 }
        )
      }
      
      if (errorMessage.includes('AccessDenied') || errorMessage.includes('Access Denied')) {
        return NextResponse.json(
          { 
            error: 'Access denied by INTMAX server.',
            details: 'The INTMAX server is denying access to deposit operations. This may be due to testnet restrictions or maintenance.',
            technicalError: errorMessage,
            status: 'access_denied',
            recommendation: 'Check INTMAX testnet status and try again later.'
          },
          { status: 403 }
        )
      }
      
      throw depositError // Re-throw if it's a different error
    }
    
    return NextResponse.json({
      success: true,
      txHash: depositResult.txHash,
      amount: amount,
      token: token,
      status: depositResult.status,
      message: `Successfully deposited ${amount} ${token} to INTMAX`
    })
  } catch (error) {
    console.error('INTMAX deposit error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Deposit failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 