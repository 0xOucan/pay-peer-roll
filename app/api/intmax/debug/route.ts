import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

export async function GET(request: NextRequest) {
  try {
    console.log('=== INTMAX DEBUG ENDPOINT ===')
    const client = await getIntmaxClient()
    
    // Get client info
    console.log('Client address:', client.address)
    console.log('Client logged in:', client.isLoggedIn)
    
    // Get tokens list
    const tokens = await client.getTokensList()
    console.log('Raw tokens response:', JSON.stringify(tokens, null, 2))
    
    // Get balances
    const { balances } = await client.fetchTokenBalances()
    console.log('Raw balances response:', JSON.stringify(balances, null, 2))
    
    // Test ETH token matching
    const ethToken = tokens.find((t: any) => {
      console.log('Testing token:', { 
        symbol: t.symbol, 
        tokenType: t.tokenType, 
        contractAddress: t.contractAddress,
        tokenIndex: t.tokenIndex
      })
      return (
        (t.symbol === 'ETH' || t.symbol === 'eth') ||
        (t.tokenType === 0) ||
        (t.contractAddress === '0x0000000000000000000000000000000000000000')
      )
    })
    
    console.log('Found ETH token:', ethToken)
    
    // Test deposit token preparation
    if (ethToken) {
      const depositToken = {
        tokenType: ethToken.tokenType ?? 0, // Default to 0 for ETH
        tokenIndex: ethToken.tokenIndex,
        decimals: ethToken.decimals,
        contractAddress: ethToken.contractAddress,
        price: ethToken.price || 0
      }
      console.log('Prepared deposit token:', depositToken)
    }
    
    // Prepare deposit token for testing
    const preparedDepositToken = ethToken ? {
      tokenType: ethToken.tokenType ?? 0,
      tokenIndex: ethToken.tokenIndex,
      decimals: ethToken.decimals,
      contractAddress: ethToken.contractAddress,
      price: ethToken.price || 0
    } : null

    return NextResponse.json({
      success: true,
      debug: {
        clientAddress: client.address,
        isLoggedIn: client.isLoggedIn,
        tokensCount: tokens.length,
        balancesCount: balances.length,
        ethTokenFound: !!ethToken,
        ethToken: ethToken,
        preparedDepositToken: preparedDepositToken,
        allTokens: tokens.map((t: any) => ({
          symbol: t.symbol,
          tokenType: t.tokenType,
          tokenIndex: t.tokenIndex,
          contractAddress: t.contractAddress,
          decimals: t.decimals
        })),
        allBalances: balances.map((b: any) => ({
          tokenSymbol: b.token.symbol,
          amount: b.amount.toString(),
          tokenType: b.token.tokenType,
          tokenIndex: b.token.tokenIndex
        }))
      }
    })
  } catch (error) {
    console.error('INTMAX debug error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Debug failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 