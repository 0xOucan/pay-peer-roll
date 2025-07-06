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
      balances: balances.map((balance: any) => {
        const tokenDecimals = balance.token.decimals || 18
        const rawAmount = balance.amount
        
        // Convert BigInt to decimal string for display
        let formattedBalance = '0'
        if (rawAmount && rawAmount !== BigInt(0)) {
          // Convert BigInt to decimal format
          const divisor = BigInt('1' + '0'.repeat(tokenDecimals))
          const wholePart = rawAmount / divisor
          const fractionalPart = rawAmount % divisor
          
          if (fractionalPart === BigInt(0)) {
            formattedBalance = wholePart.toString()
          } else {
            // Format fractional part with proper decimal places
            const fractionalStr = fractionalPart.toString().padStart(tokenDecimals, '0')
            // Remove trailing zeros
            const trimmedFractional = fractionalStr.replace(/0+$/, '')
            formattedBalance = trimmedFractional ? 
              `${wholePart}.${trimmedFractional}` : 
              wholePart.toString()
          }
        }
        
        return {
          token: balance.token,
          balance: formattedBalance,
          symbol: balance.token.symbol || 'Unknown',
          decimals: tokenDecimals
        }
      })
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