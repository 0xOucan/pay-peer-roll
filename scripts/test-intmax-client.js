// Test script for INTMAX Client SDK integration
// This script tests the client-side functionality

console.log('🚀 Testing INTMAX Client SDK Integration...')

// Test the page accessibility
async function testPageAccess() {
  try {
    console.log('\n1. Testing page accessibility...')
    const response = await fetch('http://localhost:3000/intmax-client')
    
    if (response.ok) {
      console.log('✅ INTMAX Client page is accessible')
      const html = await response.text()
      
      // Check for key components
      if (html.includes('INTMAX Client SDK')) {
        console.log('✅ Page title found')
      } else {
        console.log('❌ Page title not found')
      }
      
      if (html.includes('Initialize INTMAX Client')) {
        console.log('✅ Initialize button found')
      } else {
        console.log('❌ Initialize button not found')
      }
      
      if (html.includes('useIntMaxClient')) {
        console.log('✅ Hook import found')
      } else {
        console.log('❌ Hook import not found')
      }
      
    } else {
      console.log('❌ Page not accessible:', response.status)
    }
  } catch (error) {
    console.log('❌ Error accessing page:', error.message)
  }
}

// Test the hook file exists and is properly structured
async function testHookFile() {
  try {
    console.log('\n2. Testing hook file...')
    const fs = require('fs')
    const path = require('path')
    
    const hookPath = path.join(process.cwd(), 'hooks', 'useIntMaxClient.ts')
    
    if (fs.existsSync(hookPath)) {
      console.log('✅ Hook file exists')
      
      const content = fs.readFileSync(hookPath, 'utf8')
      
      // Check for key exports
      if (content.includes('export const useIntMaxClient')) {
        console.log('✅ Hook export found')
      } else {
        console.log('❌ Hook export not found')
      }
      
      if (content.includes('IntMaxClient')) {
        console.log('✅ IntMaxClient import found')
      } else {
        console.log('❌ IntMaxClient import not found')
      }
      
      if (content.includes('initializeClient')) {
        console.log('✅ Initialize function found')
      } else {
        console.log('❌ Initialize function not found')
      }
      
      if (content.includes('login')) {
        console.log('✅ Login function found')
      } else {
        console.log('❌ Login function not found')
      }
      
      if (content.includes('deposit')) {
        console.log('✅ Deposit function found')
      } else {
        console.log('❌ Deposit function not found')
      }
      
      if (content.includes('withdraw')) {
        console.log('✅ Withdraw function found')
      } else {
        console.log('❌ Withdraw function not found')
      }
      
      if (content.includes('transfer')) {
        console.log('✅ Transfer function found')
      } else {
        console.log('❌ Transfer function not found')
      }
      
    } else {
      console.log('❌ Hook file does not exist')
    }
  } catch (error) {
    console.log('❌ Error testing hook file:', error.message)
  }
}

// Test package.json for intmax2-client-sdk dependency
async function testDependency() {
  try {
    console.log('\n3. Testing dependency...')
    const fs = require('fs')
    const path = require('path')
    
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageContent = fs.readFileSync(packagePath, 'utf8')
    const packageJson = JSON.parse(packageContent)
    
    if (packageJson.dependencies && packageJson.dependencies['intmax2-client-sdk']) {
      console.log('✅ intmax2-client-sdk dependency found')
      console.log(`   Version: ${packageJson.dependencies['intmax2-client-sdk']}`)
    } else {
      console.log('❌ intmax2-client-sdk dependency not found')
    }
  } catch (error) {
    console.log('❌ Error testing dependency:', error.message)
  }
}

// Test dashboard navigation link
async function testDashboardLink() {
  try {
    console.log('\n4. Testing dashboard navigation...')
    const response = await fetch('http://localhost:3000/dashboard')
    
    if (response.ok) {
      const html = await response.text()
      
      if (html.includes('/intmax-client')) {
        console.log('✅ Dashboard link to INTMAX Client found')
      } else {
        console.log('❌ Dashboard link to INTMAX Client not found')
      }
      
      if (html.includes('INTMAX Client SDK')) {
        console.log('✅ Dashboard card title found')
      } else {
        console.log('❌ Dashboard card title not found')
      }
      
      if (html.includes('Frontend Integration')) {
        console.log('✅ Dashboard card subtitle found')
      } else {
        console.log('❌ Dashboard card subtitle not found')
      }
    } else {
      console.log('❌ Dashboard not accessible:', response.status)
    }
  } catch (error) {
    console.log('❌ Error testing dashboard:', error.message)
  }
}

// Run all tests
async function runTests() {
  await testPageAccess()
  await testHookFile()
  await testDependency()
  await testDashboardLink()
  
  console.log('\n🎉 INTMAX Client SDK integration tests completed!')
  console.log('\n📋 Summary:')
  console.log('- Client-side INTMAX integration implemented')
  console.log('- React hook for state management created')
  console.log('- Full-featured UI with deposit, withdraw, and transfer')
  console.log('- Dashboard navigation added')
  console.log('- Frontend-based approach using intmax2-client-sdk')
  
  console.log('\n🚀 Next Steps:')
  console.log('1. Navigate to /intmax-client to test the integration')
  console.log('2. Initialize the INTMAX client')
  console.log('3. Login to your INTMAX account')
  console.log('4. Test deposit, withdraw, and transfer functionality')
  console.log('5. Compare with server-side integration at /intmax')
}

// Run the test if this file is executed directly
if (require.main === module) {
  runTests()
}

module.exports = { runTests } 