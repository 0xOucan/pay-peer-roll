import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching INTMAX balances...')
    const client = await getIntmaxClient()
    
    console.log('Fetching token balances...')
    const { balances } = await client.fetchTokenBalances()
    
    console.log('Balances fetched successfully:', balances)
    
    return NextResponse.json({
      success: true,
      balances: balances.map((balance: any) => ({
        token: balance.token,
        balance: balance.amount.toString(),
        symbol: balance.token.symbol || 'Unknown',
        decimals: balance.token.decimals || 18
      }))
    })
  } catch (error) {
    console.error('INTMAX balances error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch balances',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 