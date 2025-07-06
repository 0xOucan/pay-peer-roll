#!/usr/bin/env node

/**
 * Test script for INTMAX integration
 * This script tests the API endpoints to ensure they're working correctly
 */

const baseUrl = 'http://localhost:3000/api/intmax'

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options)
    const data = await response.json()
    
    console.log(`✅ ${method} ${endpoint}:`, response.status, response.ok ? '✓' : '✗')
    if (!response.ok) {
      console.log('   Error:', data.error)
    }
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Testing INTMAX Integration Endpoints...\n')
  
  // Test login endpoint
  console.log('1. Testing Login Endpoint')
  const loginResult = await testEndpoint('/login', 'POST')
  
  // Test balances endpoint
  console.log('\n2. Testing Balances Endpoint')
  const balancesResult = await testEndpoint('/balances', 'GET')
  
  // Test deposit endpoint
  console.log('\n3. Testing Deposit Endpoint')
  const depositResult = await testEndpoint('/deposit', 'POST', {
    amount: '0.1',
    token: 'ETH'
  })
  
  // Test withdraw endpoint
  console.log('\n4. Testing Withdraw Endpoint')
  const withdrawResult = await testEndpoint('/withdraw', 'POST', {
    amount: '0.05',
    token: 'ETH',
    toAddress: '0x1234567890123456789012345678901234567890'
  })
  
  // Test multi-send endpoint
  console.log('\n5. Testing Multi-Send Endpoint')
  const multiSendResult = await testEndpoint('/multi-send', 'POST', {
    recipients: [
      { address: '0x1234567890123456789012345678901234567890', amount: '0.01' },
      { address: '0x0987654321098765432109876543210987654321', amount: '0.02' }
    ],
    token: 'ETH'
  })
  
  // Test logout endpoint
  console.log('\n6. Testing Logout Endpoint')
  const logoutResult = await testEndpoint('/logout', 'POST')
  
  console.log('\n📊 Test Summary:')
  const tests = [
    { name: 'Login', result: loginResult },
    { name: 'Balances', result: balancesResult },
    { name: 'Deposit', result: depositResult },
    { name: 'Withdraw', result: withdrawResult },
    { name: 'Multi-Send', result: multiSendResult },
    { name: 'Logout', result: logoutResult }
  ]
  
  const passed = tests.filter(t => t.result.success).length
  const total = tests.length
  
  console.log(`✅ Passed: ${passed}/${total}`)
  
  if (passed === total) {
    console.log('🎉 All INTMAX integration tests passed!')
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.')
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testEndpoint, runTests } 