import { NextRequest, NextResponse } from 'next/server'
import { clearIntmaxSession } from '@/lib/intmax-session'

export async function POST(request: NextRequest) {
  try {
    console.log('Logging out from INTMAX...')
    await clearIntmaxSession()
    
    console.log('Logout successful')
    
    return NextResponse.json({
      success: true,
      message: 'Successfully logged out from INTMAX'
    })
  } catch (error) {
    console.error('INTMAX logout error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Logout failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 