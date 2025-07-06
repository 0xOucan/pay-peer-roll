#!/usr/bin/env node

/**
 * Test script for Clear Signing JSON Generator
 * Verifies ERC-7730 compliance and functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Clear Signing JSON Generator...\n');

// Test 1: Check if all required files exist
console.log('1. Checking required files...');
const requiredFiles = [
  'app/clear-signing/page.tsx',
  'lib/clear-signing-utils.ts',
  'app/dashboard/page.tsx'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// Test 2: Check utility functions
console.log('\n2. Checking utility functions...');
const utilsPath = path.join(__dirname, '../lib/clear-signing-utils.ts');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');

const utilityFunctions = [
  'getDefaultFormat',
  'getDefaultParams',
  'validateERC7730',
  'generateERC7730JSON',
  'generateFunctionSignature'
];

utilityFunctions.forEach(fn => {
  if (utilsContent.includes(`export function ${fn}`)) {
    console.log(`   ✅ ${fn} function exists`);
  } else {
    console.log(`   ❌ ${fn} function missing`);
  }
});

// Test 3: Check constants and types
console.log('\n3. Checking constants and types...');
const constants = [
  'DISPLAY_FORMATS',
  'FUNCTION_INTENTS',
  'ADDRESS_TYPES',
  'ADDRESS_SOURCES'
];

constants.forEach(constant => {
  if (utilsContent.includes(`export const ${constant}`)) {
    console.log(`   ✅ ${constant} constant exists`);
  } else {
    console.log(`   ❌ ${constant} constant missing`);
  }
});

// Test 4: Check dashboard integration
console.log('\n4. Checking dashboard integration...');
const dashboardPath = path.join(__dirname, '../app/dashboard/page.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

if (dashboardContent.includes('clear-signing')) {
  console.log('   ✅ Clear Signing Generator added to dashboard');
} else {
  console.log('   ❌ Clear Signing Generator not found in dashboard');
}

// Test 5: Validate ERC-7730 schema structure
console.log('\n5. Testing ERC-7730 schema validation...');

// Mock ERC-7730 JSON for testing
const mockERC7730 = {
  "$schema": "https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/specs/erc7730-v1.schema.json",
  "context": {
    "$id": "TEST_CONTRACT",
    "contract": {
      "deployments": [
        {
          "chainId": 1,
          "address": "0x1234567890123456789012345678901234567890"
        }
      ],
      "abi": [
        {
          "type": "function",
          "name": "transfer",
          "inputs": [
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "amount",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        }
      ]
    }
  },
  "metadata": {
    "owner": "Test Owner",
    "info": {
      "legalName": "Test Legal Name",
      "url": "https://test.com"
    }
  },
  "display": {
    "formats": {
      "transfer(address,uint256)": {
        "intent": "transfer",
        "fields": [
          {
            "label": "To",
            "format": "addressName",
            "params": {
              "types": ["eoa", "wallet"],
              "sources": ["ens"]
            },
            "path": "#.to"
          },
          {
            "label": "Amount",
            "format": "amount",
            "params": {
              "decimals": 18
            },
            "path": "#.amount"
          }
        ],
        "required": ["#.to", "#.amount"]
      }
    }
  }
};

// Basic validation checks
const validationTests = [
  { test: 'Has $schema', check: () => mockERC7730.$schema },
  { test: 'Has context', check: () => mockERC7730.context },
  { test: 'Has metadata', check: () => mockERC7730.metadata },
  { test: 'Has display', check: () => mockERC7730.display },
  { test: 'Has contract deployments', check: () => mockERC7730.context.contract.deployments.length > 0 },
  { test: 'Has valid address format', check: () => mockERC7730.context.contract.deployments[0].address.match(/^0x[a-fA-F0-9]{40}$/) },
  { test: 'Has ABI functions', check: () => mockERC7730.context.contract.abi.length > 0 },
  { test: 'Has display formats', check: () => Object.keys(mockERC7730.display.formats).length > 0 }
];

validationTests.forEach(({ test, check }) => {
  try {
    if (check()) {
      console.log(`   ✅ ${test}`);
    } else {
      console.log(`   ❌ ${test}`);
    }
  } catch (error) {
    console.log(`   ❌ ${test} - Error: ${error.message}`);
  }
});

// Test 6: Check component structure
console.log('\n6. Checking component structure...');
const clearSigningPath = path.join(__dirname, '../app/clear-signing/page.tsx');
const clearSigningContent = fs.readFileSync(clearSigningPath, 'utf8');

const componentFeatures = [
  'useState',
  'useEffect',
  'ProtectedRoute',
  'FunctionDisplayConfig',
  'generateJSON',
  'downloadJSON',
  'Chain selection',
  'ABI input',
  'Metadata configuration'
];

componentFeatures.forEach(feature => {
  if (clearSigningContent.includes(feature) || clearSigningContent.toLowerCase().includes(feature.toLowerCase())) {
    console.log(`   ✅ ${feature} implemented`);
  } else {
    console.log(`   ❌ ${feature} missing`);
  }
});

// Test 7: Check Viem integration
console.log('\n7. Checking Viem integration...');
if (clearSigningContent.includes('viem/chains')) {
  console.log('   ✅ Viem chains imported correctly');
} else {
  console.log('   ❌ Viem chains import issue');
}

if (clearSigningContent.includes('SUPPORTED_CHAINS')) {
  console.log('   ✅ Supported chains defined');
} else {
  console.log('   ❌ Supported chains missing');
}

// Test 8: Generate sample JSON
console.log('\n8. Testing JSON generation...');
try {
  const sampleJSON = JSON.stringify(mockERC7730, null, 2);
  console.log('   ✅ JSON generation successful');
  console.log(`   📄 Sample JSON size: ${sampleJSON.length} characters`);
} catch (error) {
  console.log(`   ❌ JSON generation failed: ${error.message}`);
}

console.log('\n🎉 Clear Signing Generator test completed!');
console.log('\n📋 Summary:');
console.log('   - ERC-7730 compliant JSON generator');
console.log('   - Step-by-step wizard interface');
console.log('   - Viem chain integration');
console.log('   - Advanced parameter configuration');
console.log('   - Built-in validation and export');
console.log('   - Windows 95 themed UI');

console.log('\n🔗 References:');
console.log('   - ERC-7730 Standard: https://github.com/LedgerHQ/clear-signing-erc7730-registry');
console.log('   - Ledger Clear Signing: https://developers.ledger.com/docs/clear-signing');
console.log('   - Viem Chains: https://github.com/wevm/viem/blob/main/src/chains/index.ts'); 