import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipients, token, tokenAddress } = body

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token type is required' },
        { status: 400 }
      )
    }

    // Validate all recipients
    for (const recipient of recipients) {
      if (!recipient.address || !/^0x[a-fA-F0-9]{40}$/.test(recipient.address)) {
        return NextResponse.json(
          { error: `Invalid address: ${recipient.address}` },
          { status: 400 }
        )
      }
      
      if (!recipient.amount || parseFloat(recipient.amount) <= 0) {
        return NextResponse.json(
          { error: `Invalid amount for address ${recipient.address}` },
          { status: 400 }
        )
      }
    }

    console.log(`Initiating multi-send: ${recipients.length} recipients for ${token}`)
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
    
    // Prepare broadcast transactions for each recipient
    const broadcastRequests = recipients.map(recipient => ({
      address: recipient.address,
      amount: parseFloat(recipient.amount),
      token: targetToken
    }))
    
    // Perform the multi-send using broadcastTransaction
    const broadcastResult = await client.broadcastTransaction(broadcastRequests, false)
    
    console.log('Multi-send successful:', broadcastResult)
    
    // Create transaction results for each recipient
    const transactions = recipients.map((recipient, index) => ({
      txTreeRoot: broadcastResult.txTreeRoot,
      transferDigest: broadcastResult.transferDigests[index] || 'unknown',
      recipient: recipient.address,
      amount: recipient.amount,
      status: 'success'
    }))
    
    return NextResponse.json({
      success: true,
      transactions: transactions,
      token: token,
      totalRecipients: recipients.length,
      message: `Successfully sent ${token} to ${recipients.length} recipients with privacy mixing`
    })
  } catch (error) {
    console.error('INTMAX multi-send error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Multi-send failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 