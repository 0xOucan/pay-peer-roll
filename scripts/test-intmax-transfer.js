const API_BASE = 'http://localhost:3000/api/intmax'

async function testIntmaxTransfer() {
  console.log('🔄 Testing INTMAX Transfer API...')
  
  try {
    // Test 1: Login first
    console.log('\n1. Testing login...')
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const loginData = await loginResponse.json()
    console.log('Login response:', loginData)
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.error}`)
    }
    
    // Test 2: Test transfer with valid INTMAX addresses
    console.log('\n2. Testing INTMAX transfer...')
    const transferResponse = await fetch(`${API_BASE}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: [
          {
            address: 'T6ubiG36LmNce6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcFtvXnBB3bqice6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcB3prnCZ',
            amount: '0.000001'
          }
        ],
        token: 'ETH'
      })
    })
    
    const transferData = await transferResponse.json()
    console.log('Transfer response:', transferData)
    
    if (transferResponse.ok) {
      console.log('✅ Transfer successful!')
      console.log(`   - Transaction Root: ${transferData.txTreeRoot}`)
      console.log(`   - Transfer Digests: ${transferData.transferDigests}`)
      console.log(`   - Recipients: ${transferData.totalRecipients}`)
    } else {
      console.log('❌ Transfer failed:', transferData.error)
    }
    
    // Test 3: Test with invalid INTMAX address (should fail)
    console.log('\n3. Testing with invalid INTMAX address...')
    const invalidResponse = await fetch(`${API_BASE}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: '0.000001'
          }
        ],
        token: 'ETH'
      })
    })
    
    const invalidData = await invalidResponse.json()
    console.log('Invalid address response:', invalidData)
    
    if (!invalidResponse.ok) {
      console.log('✅ Correctly rejected invalid address')
    } else {
      console.log('❌ Should have rejected invalid address')
    }
    
    // Test 4: Test with missing token (should fail)
    console.log('\n4. Testing with missing token...')
    const noTokenResponse = await fetch(`${API_BASE}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: [
          {
            address: 'T6ubiG36LmNce6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcFtvXnBB3bqice6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcB3prnCZ',
            amount: '0.000001'
          }
        ]
      })
    })
    
    const noTokenData = await noTokenResponse.json()
    console.log('No token response:', noTokenData)
    
    if (!noTokenResponse.ok) {
      console.log('✅ Correctly rejected missing token')
    } else {
      console.log('❌ Should have rejected missing token')
    }
    
    console.log('\n🎉 INTMAX Transfer API tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.cause) {
      console.error('   Cause:', error.cause)
    }
  }
}

// Run the test
if (require.main === module) {
  testIntmaxTransfer()
}

module.exports = { testIntmaxTransfer } 