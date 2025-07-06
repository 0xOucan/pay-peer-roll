import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, token, toAddress, tokenAddress } = body

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

    if (!toAddress || !/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      return NextResponse.json(
        { error: 'Valid recipient address is required' },
        { status: 400 }
      )
    }

    console.log(`Initiating withdrawal: ${amount} ${token} to ${toAddress}`)
    const client = await getIntmaxClient()
    
    // Get tokens list to find the correct token
    const tokens = await client.getTokensList()
    console.log('Available tokens:', tokens)
    console.log('Looking for token:', token)
    
    // Find the token by symbol or address with more robust matching
    let targetToken = tokens.find((t: any) => {
      console.log('Checking token:', { symbol: t.symbol, tokenType: t.tokenType, contractAddress: t.contractAddress })
      
      if (token === 'ETH') {
        // For ETH, check multiple conditions
        return (
          (t.symbol === 'ETH' || t.symbol === 'eth') ||
          (t.tokenType === 0) ||
          (t.contractAddress === '0x0000000000000000000000000000000000000000')
        )
      }
      
      if (token === 'USDC' && tokenAddress) {
        return t.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
      }
      
      // Fallback: match by symbol
      return t.symbol?.toLowerCase() === token.toLowerCase()
    })
    
    if (!targetToken) {
      console.log('Token not found. Available tokens:', tokens.map((t: any) => ({ 
        symbol: t.symbol, 
        tokenType: t.tokenType, 
        contractAddress: t.contractAddress 
      })))
      return NextResponse.json(
        { 
          error: `Token ${token} not found in available tokens list`,
          availableTokens: tokens.map((t: any) => t.symbol).filter(Boolean)
        },
        { status: 400 }
      )
    }
    
    console.log('Using token:', targetToken)
    
    // Perform the withdrawal
    const withdrawResult = await client.withdraw({
      address: toAddress as `0x${string}`,
      token: targetToken,
      amount: parseFloat(amount)
    })
    
    console.log('Withdrawal successful:', withdrawResult)
    
    return NextResponse.json({
      success: true,
      txTreeRoot: withdrawResult.txTreeRoot,
      transferDigests: withdrawResult.transferDigests,
      amount: amount,
      token: token,
      toAddress: toAddress,
      message: `Successfully withdrew ${amount} ${token} to ${toAddress}`
    })
  } catch (error) {
    console.error('INTMAX withdrawal error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Withdrawal failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 