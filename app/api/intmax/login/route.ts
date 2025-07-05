import { NextRequest, NextResponse } from 'next/server'
import { getIntmaxClient } from '@/lib/intmax-session'

export async function POST(request: NextRequest) {
  try {
    console.log('Getting INTMAX client...')
    const client = await getIntmaxClient()
    
    console.log('Fetching token balances...')
    const { balances } = await client.fetchTokenBalances()
    
    console.log('Login successful, address:', client.address)
    console.log('Balances:', balances)
    
    return NextResponse.json({
      success: true,
      address: client.address,
      balances: balances.map((balance: any) => ({
        token: balance.token,
        balance: balance.amount.toString(),
        symbol: balance.token.symbol || 'Unknown',
        decimals: balance.token.decimals || 18
      }))
    })
  } catch (error) {
    console.error('INTMAX login error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Login failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 