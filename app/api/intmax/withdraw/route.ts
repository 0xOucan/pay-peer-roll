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