#!/usr/bin/env node

/**
 * INTMAX Debug Test Script
 * 
 * This script helps debug token matching issues by calling the debug endpoint
 * and testing deposit functionality.
 */

const BASE_URL = 'http://localhost:3000'

async function testDebugEndpoint() {
  console.log('🔍 Testing INTMAX Debug Endpoint...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/intmax/debug`)
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Debug endpoint successful!')
      console.log('📊 Debug Info:')
      console.log(`   - Client Address: ${data.debug.clientAddress}`)
      console.log(`   - Is Logged In: ${data.debug.isLoggedIn}`)
      console.log(`   - Tokens Count: ${data.debug.tokensCount}`)
      console.log(`   - Balances Count: ${data.debug.balancesCount}`)
      console.log(`   - ETH Token Found: ${data.debug.ethTokenFound}`)
      
      if (data.debug.ethToken) {
        console.log('🎯 ETH Token Details:')
        console.log(`   - Symbol: ${data.debug.ethToken.symbol}`)
        console.log(`   - Token Type: ${data.debug.ethToken.tokenType}`)
        console.log(`   - Token Index: ${data.debug.ethToken.tokenIndex}`)
        console.log(`   - Contract Address: ${data.debug.ethToken.contractAddress}`)
        console.log(`   - Decimals: ${data.debug.ethToken.decimals}`)
      }
      
      console.log('\n📋 All Available Tokens:')
      data.debug.allTokens.forEach((token, index) => {
        console.log(`   ${index + 1}. ${token.symbol} (Type: ${token.tokenType}, Index: ${token.tokenIndex})`)
      })
      
      console.log('\n💰 All Balances:')
      data.debug.allBalances.forEach((balance, index) => {
        console.log(`   ${index + 1}. ${balance.tokenSymbol}: ${balance.amount} (Type: ${balance.tokenType})`)
      })
      
      return data.debug
    } else {
      console.log('❌ Debug endpoint failed:', data.error)
      return null
    }
  } catch (error) {
    console.log('❌ Error calling debug endpoint:', error.message)
    return null
  }
}

async function testDepositEndpoint(debugData) {
  console.log('\n🚀 Testing Deposit Endpoint...')
  
  if (!debugData || !debugData.ethTokenFound) {
    console.log('⚠️  Skipping deposit test - ETH token not found')
    return
  }
  
  try {
    const depositData = {
      amount: '0.001', // Small test amount
      token: 'ETH',
      tokenAddress: '0x0000000000000000000000000000000000000000'
    }
    
    console.log('📤 Sending deposit request:', depositData)
    
    const response = await fetch(`${BASE_URL}/api/intmax/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(depositData)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Deposit successful!')
      console.log('📊 Deposit Result:', data)
    } else {
      console.log('❌ Deposit failed:', data.error)
      if (data.availableTokens) {
        console.log('🔍 Available tokens:', data.availableTokens)
      }
      if (data.details) {
        console.log('📋 Details:', data.details)
      }
    }
  } catch (error) {
    console.log('❌ Error calling deposit endpoint:', error.message)
  }
}

async function main() {
  console.log('🧪 INTMAX Debug Test Script')
  console.log('=' .repeat(50))
  
  const debugData = await testDebugEndpoint()
  await testDepositEndpoint(debugData)
  
  console.log('\n' + '='.repeat(50))
  console.log('✨ Test completed!')
  console.log('\n💡 Tips:')
  console.log('   - Make sure your dev server is running: npm run dev')
  console.log('   - Check the server logs for detailed debugging info')
  console.log('   - Visit /api/intmax/debug in your browser for JSON response')
}

main().catch(console.error) 