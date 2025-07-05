# INTMAX Deposit Fixes

## 🔍 **Issues Identified from Logs**

Based on your error logs and the [INTMAX SDK documentation](https://aquatic-paperback-675.notion.site/INTMAX-Client-SDK-Docs-176d989987db8096a012d144ae0e0dba#1c7d989987db804a96aaeaa58d45058d), several issues were identified:

### **1. Missing `tokenType` Property**
```
Checking token: {
  symbol: 'ETH',
  tokenType: undefined,  // ❌ This was undefined
  contractAddress: '0x0000000000000000000000000000000000000000'
}
```

### **2. BigInt Conversion Errors**
```
Float amount failed, trying with BigInt: SyntaxError: Cannot convert 0.01 to a BigInt
Deposit failed: SyntaxError: Cannot convert 10,000,000,000,000,000 to a BigInt
```

### **3. Wrong Amount Format**
The SDK expects decimal amounts (e.g., `0.000001`), not BigInt values.

### **4. Missing Gas Estimation**
The SDK documentation shows gas estimation is required before deposits.

## 🛠️ **Fixes Applied**

### **1. Correct Token Structure**

**Before (Incorrect)**:
```typescript
// Using raw token directly
depositResult = await client.deposit({
  token: targetToken, // Raw token with undefined tokenType
  amount: parseFloat(amount),
  address: client.address,
  isMining: false
})
```

**After (Correct)**:
```typescript
// Prepare token object according to INTMAX SDK requirements
const depositToken = {
  tokenType: targetToken.tokenType ?? (token === 'ETH' ? 0 : 1), // Default to 0 for ETH, 1 for ERC20
  tokenIndex: targetToken.tokenIndex,
  decimals: targetToken.decimals,
  contractAddress: targetToken.contractAddress,
  price: targetToken.price || 0
}
```

### **2. Gas Estimation First**

Following the [SDK documentation](https://aquatic-paperback-675.notion.site/INTMAX-Client-SDK-Docs-176d989987db8096a012d144ae0e0dba#1c7d989987db804a96aaeaa58d45058d):

```typescript
// First, estimate gas as recommended in the SDK docs
console.log('Estimating gas for deposit...')
const gasEstimate = await client.estimateDepositGas({
  ...depositParams,
  isGasEstimation: true
})
console.log('Gas estimate:', gasEstimate.toString())

// Then proceed with deposit
console.log('Executing deposit...')
depositResult = await client.deposit(depositParams)
```

### **3. Correct Amount Format**

**Before (Wrong)**:
```typescript
// Trying BigInt conversion
const amountInWei = BigInt(Math.floor(amountFloat * 1e18))
```

**After (Correct)**:
```typescript
// Use decimal amount directly as per SDK docs
const depositParams = {
  amount: parseFloat(amount), // 0.01 for 0.01 ETH
  token: depositToken,
  address: client.address,
  isMining: false
}
```

### **4. Enhanced Debug Information**

Added proper token structure debugging:

```typescript
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
```

## 📋 **INTMAX SDK Requirements**

Based on the [official documentation](https://aquatic-paperback-675.notion.site/INTMAX-Client-SDK-Docs-176d989987db8096a012d144ae0e0dba#1c7d989987db804a96aaeaa58d45058d):

### **Required Token Structure**
```typescript
{
  tokenType: 0,        // 0 for ETH, 1 for ERC20
  tokenIndex: 0,       // Token index from INTMAX
  decimals: 18,        // Token decimals
  contractAddress: "0x0000000000000000000000000000000000000000", // Contract address
  price: 2417.08       // Token price
}
```

### **Required Deposit Parameters**
```typescript
{
  amount: 0.000001,    // Decimal amount (not BigInt)
  token: depositToken, // Properly structured token object
  address: "T7iFM...", // INTMAX address
  isMining: false,     // Mining flag
}
```

### **Gas Estimation Required**
```typescript
const gas: bigint = await client.estimateDepositGas({
  ...params,
  isGasEstimation: true,
});
```

## 🎯 **Expected Behavior Now**

### **✅ What Should Work**
1. **Token Structure**: Proper `tokenType` defaulting (0 for ETH, 1 for ERC20)
2. **Amount Format**: Decimal amounts without BigInt conversion errors
3. **Gas Estimation**: Pre-deposit gas estimation as per SDK requirements
4. **Error Handling**: Better error messages and debugging

### **📊 Expected Logs**
```
Initiating deposit: 0.01 ETH
Available tokens: [...]
Looking for token: ETH
Using token: { symbol: 'ETH', tokenIndex: 0, ... }
Deposit parameters: {
  amount: 0.01,
  token: { tokenType: 0, tokenIndex: 0, ... },
  address: "T82j4LNnPVQ7YgcMDnQMHjKyezmsaNwoRT2xFcQLYwTnRcKeBroUiBD567J38g6avRQn9sosUrT8eMqzbvSq5Wpi12ZBZk7",
  isMining: false
}
Estimating gas for deposit...
Gas estimate: 114231256530
Executing deposit...
Deposit successful: { status: 2, txHash: "0x..." }
```

## 🧪 **Testing the Fixes**

### **1. Test Debug Endpoint**
```bash
# Visit or curl the debug endpoint
curl http://localhost:3000/api/intmax/debug
```

**Expected Response**:
```json
{
  "success": true,
  "debug": {
    "ethTokenFound": true,
    "ethToken": { "symbol": "ETH", "tokenIndex": 0, ... },
    "preparedDepositToken": { "tokenType": 0, "tokenIndex": 0, ... }
  }
}
```

### **2. Test Deposit**
Try depositing a small amount (0.001 ETH) through the UI.

**Expected Behavior**:
- ✅ Gas estimation succeeds
- ✅ Deposit parameters are properly formatted
- ✅ No BigInt conversion errors
- ✅ Proper token structure used

### **3. Check Server Logs**
Look for the improved logging:
```
Estimating gas for deposit...
Gas estimate: [number]
Executing deposit...
```

## ⚠️ **Known Limitations**

Even with these fixes, deposits might still fail due to:
1. **INTMAX Testnet Restrictions**: Some operations may be limited
2. **Network Issues**: Connectivity problems with INTMAX nodes
3. **Balance Requirements**: Insufficient ETH balance for gas
4. **AML Checks**: On-chain Anti-Money Laundering validation

## 🔧 **Troubleshooting**

### **If Gas Estimation Fails**
- Check your ETH balance on Sepolia
- Verify INTMAX testnet connectivity
- Try smaller amounts

### **If Deposit Still Fails**
- Check the exact error message
- Verify token structure in debug endpoint
- Ensure proper INTMAX address format

### **If Token Structure Issues**
- Use the debug endpoint to verify token properties
- Check if `tokenType` is properly set
- Verify `tokenIndex` and other required fields

## 🎉 **Summary**

The fixes address the core issues identified in your logs:

1. **✅ Fixed Token Structure**: Proper `tokenType` handling with defaults
2. **✅ Fixed Amount Format**: Using decimal amounts as per SDK requirements
3. **✅ Added Gas Estimation**: Following SDK best practices
4. **✅ Enhanced Debugging**: Better visibility into the deposit process
5. **✅ Removed BigInt Errors**: Proper amount handling without conversion issues

The deposit functionality should now work correctly according to the [INTMAX SDK documentation](https://aquatic-paperback-675.notion.site/INTMAX-Client-SDK-Docs-176d989987db8096a012d144ae0e0dba#1c7d989987db804a96aaeaa58d45058d) specifications.

---

*These fixes ensure proper INTMAX deposit functionality with correct token structure, amount formatting, and gas estimation as required by the SDK.* 