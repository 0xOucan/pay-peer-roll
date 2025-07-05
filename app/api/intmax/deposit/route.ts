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
    
    // Get tokens list to find the correct token
    const tokens = await client.getTokensList()
    console.log('Available tokens:', tokens)
    
    // Find the token by symbol or address
    let targetToken = tokens.find((t: any) => 
      (token === 'ETH' && t.tokenType === 0) || // NATIVE token
      (token === 'USDC' && t.contractAddress?.toLowerCase() === tokenAddress?.toLowerCase())
    )
    
    if (!targetToken) {
      return NextResponse.json(
        { error: `Token ${token} not found in available tokens list` },
        { status: 400 }
      )
    }
    
    console.log('Using token:', targetToken)
    
    let depositResult: any
    
    try {
      // Perform the deposit with proper error handling
      depositResult = await client.deposit({
        token: targetToken,
        amount: parseFloat(amount),
        address: client.address,
        isMining: false
      })
      
      console.log('Deposit successful:', depositResult)
    } catch (depositError) {
      console.error('Deposit failed:', depositError)
      
      // Check if it's a known issue and provide helpful error message
      const errorMessage = depositError instanceof Error ? depositError.message : 'Unknown deposit error'
      
      if (errorMessage.includes('Transfer-Encoding') || errorMessage.includes('NotImplemented')) {
        return NextResponse.json(
          { 
            error: 'Deposit functionality is currently experiencing technical issues. This may be due to INTMAX testnet limitations.',
            details: 'The INTMAX testnet may have restrictions on deposit operations. Please try again later or contact support.',
            technicalError: errorMessage
          },
          { status: 503 }
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