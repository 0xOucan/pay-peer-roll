import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

interface TransferRequest {
  recipients: Array<{
    address: string // INTMAX address (T format)
    amount: string
  }>
  token: string
  tokenAddress?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TransferRequest = await request.json()
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

    // Validate all recipients have INTMAX addresses
    for (const recipient of recipients) {
      if (!recipient.address || !recipient.address.startsWith('T')) {
        return NextResponse.json(
          { error: `Invalid INTMAX address: ${recipient.address}. Address must start with 'T'` },
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

    console.log(`Initiating INTMAX transfer: ${recipients.length} recipients for ${token}`)
    const client = await getIntmaxClient()
    
    // Get both tokens list and balances for complete token information
    const [tokensList, { balances }] = await Promise.all([
      client.getTokensList(),
      client.fetchTokenBalances()
    ])
    
    console.log('Available balances:', balances)
    console.log('Available tokens:', tokensList)
    console.log('Looking for token:', token)
    
    // Find the token - prioritize balance data as it has complete information
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
      targetToken = tokensList.find((t: any) => {
        if (token === 'ETH') {
          return (
            t.symbol === 'ETH' || 
            t.tokenType === 0 || 
            t.contractAddress === '0x0000000000000000000000000000000000000000'
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
      console.log('Token not found. Available tokens:', tokensList.map((t: any) => ({ 
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
          availableTokens: tokensList.map((t: any) => t.symbol).filter(Boolean),
          availableBalances: balances.map((b: any) => b.token.symbol).filter(Boolean)
        },
        { status: 400 }
      )
    }

    console.log('Using token:', targetToken)

    // Prepare token object according to INTMAX SDK requirements
    const transferToken = {
      tokenType: targetToken.tokenType ?? (token === 'ETH' ? 0 : 1), // Default to 0 for ETH, 1 for ERC20
      tokenIndex: targetToken.tokenIndex || 0,
      decimals: targetToken.decimals || 18,
      contractAddress: targetToken.contractAddress || "0x0000000000000000000000000000000000000000",
      price: targetToken.price || 0
    }
    
    // Prepare broadcast transaction requests for INTMAX addresses
    const broadcastRequests = recipients.map(recipient => ({
      address: recipient.address, // INTMAX address
      amount: parseFloat(recipient.amount), // Use decimal amount as per SDK docs
      token: transferToken
    }))
    
    console.log('Broadcasting transactions:', broadcastRequests)
    
    // Perform the transfer using broadcastTransaction
    const broadcastResult = await client.broadcastTransaction(broadcastRequests, false)
    
    console.log('INTMAX transfer successful:', broadcastResult)
    
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
      txTreeRoot: broadcastResult.txTreeRoot,
      transferDigests: broadcastResult.transferDigests,
      token: token,
      totalRecipients: recipients.length,
      message: `Successfully transferred ${token} to ${recipients.length} INTMAX address(es) with privacy mixing`
    })
  } catch (error) {
    console.error('INTMAX transfer error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Transfer failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 