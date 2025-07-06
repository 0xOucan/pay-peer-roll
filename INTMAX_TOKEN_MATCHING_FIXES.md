# INTMAX Token Matching Fixes

## 🔍 **Issue Analysis**

You reported: `"Token ETH not found in available tokens list"` despite having ETH in your balance.

### **Root Cause**
The original token matching logic was too restrictive and only checked for `t.tokenType === 0`, but the actual token structure from INTMAX might have different properties or values.

## 🛠️ **Fixes Applied**

### **1. Enhanced Token Matching Logic**

**Before (Restrictive)**:
```typescript
let targetToken = tokens.find((t: any) => 
  (token === 'ETH' && t.tokenType === 0) || // Only this condition
  (token === 'USDC' && t.contractAddress?.toLowerCase() === tokenAddress?.toLowerCase())
)
```

**After (Robust)**:
```typescript
let targetToken = tokens.find((t: any) => {
  if (token === 'ETH') {
    // Multiple conditions for ETH matching
    return (
      (t.symbol === 'ETH' || t.symbol === 'eth') ||           // Symbol match
      (t.tokenType === 0) ||                                  // Type match
      (t.contractAddress === '0x0000000000000000000000000000000000000000') // Address match
    )
  }
  
  if (token === 'USDC' && tokenAddress) {
    return t.contractAddress?.toLowerCase() === tokenAddress.toLowerCase()
  }
  
  // Fallback: match by symbol (case-insensitive)
  return t.symbol?.toLowerCase() === token.toLowerCase()
})
```

### **2. Enhanced Debugging & Logging**

Added comprehensive logging to understand what's happening:

```typescript
console.log('Available tokens:', tokens)
console.log('Looking for token:', token)
console.log('Checking token:', { symbol: t.symbol, tokenType: t.tokenType, contractAddress: t.contractAddress })
```

### **3. Better Error Messages**

**Before**:
```json
{ "error": "Token ETH not found in available tokens list" }
```

**After**:
```json
{
  "error": "Token ETH not found in available tokens list",
  "availableTokens": ["ETH", "USDC", "DGE", "TEST"]
}
```

### **4. Amount Format Handling**

Added support for different amount formats (float vs BigInt):

```typescript
// Try with float first
try {
  depositResult = await client.deposit({
    token: targetToken,
    amount: parseFloat(amount),
    address: client.address,
    isMining: false
  })
} catch (floatError) {
  // Try with BigInt (wei format)
  const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18))
  depositResult = await client.deposit({
    token: targetToken,
    amount: amountInWei,
    address: client.address,
    isMining: false
  })
}
```

## 🧪 **Debug Tools Created**

### **1. Debug API Endpoint**
**URL**: `/api/intmax/debug`

**What it shows**:
- Client address and login status
- All available tokens with their properties
- All balances with amounts
- ETH token matching test results

### **2. Debug Test Script**
**File**: `scripts/test-intmax-debug.js`

**Usage**:
```bash
node scripts/test-intmax-debug.js
```

**What it does**:
- Tests the debug endpoint
- Shows all available tokens
- Tests deposit functionality
- Provides detailed logging

## 📋 **Testing Instructions**

### **Step 1: Start Development Server**
```bash
npm run dev
```

### **Step 2: Test Debug Endpoint**
Visit: `http://localhost:3000/api/intmax/debug`

Or run the test script:
```bash
node scripts/test-intmax-debug.js
```

### **Step 3: Check Server Logs**
Look for detailed logging in your terminal:
```
=== INTMAX DEBUG ENDPOINT ===
Client address: T82j4LNnPVQ7YgcMDnQMHjKyezmsaNwoRT2xFcQLYwTnRcKeBroUiBD567J38g6avRQn9sosUrT8eMqzbvSq5Wpi12ZBZk7
Raw tokens response: [...]
Testing token: { symbol: 'ETH', tokenType: 0, contractAddress: '0x0000000000000000000000000000000000000000' }
Found ETH token: { ... }
```

### **Step 4: Test Deposit**
Try depositing a small amount (0.001 ETH) through the UI and check the logs for:
```
Looking for token: ETH
Checking token: { symbol: 'ETH', tokenType: 0, contractAddress: '0x0000000000000000000000000000000000000000' }
Using token: { ... }
Deposit parameters: { ... }
```

## 🎯 **Expected Outcomes**

### **✅ What Should Work Now**
1. **Token Discovery**: ETH token should be found in the available tokens list
2. **Enhanced Matching**: Multiple matching criteria for better reliability
3. **Detailed Logging**: Clear visibility into what's happening
4. **Error Handling**: Better error messages with available tokens list

### **⚠️ Known Limitations**
- **Deposit Operations**: May still fail due to INTMAX testnet restrictions
- **Transfer-Encoding**: Server-side limitation that we handle gracefully

## 🔍 **Troubleshooting Guide**

### **If ETH Token Still Not Found**

1. **Check Debug Endpoint**: Visit `/api/intmax/debug` to see raw token data
2. **Check Server Logs**: Look for detailed token matching logs
3. **Verify Token Structure**: The debug endpoint shows exactly what properties each token has

### **If Deposit Still Fails**

1. **Check Amount Format**: Try both small (0.001) and larger amounts
2. **Check Server Logs**: Look for deposit parameter logs
3. **Verify Balance**: Ensure you have sufficient ETH balance

### **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| Token not found | Check debug endpoint for actual token structure |
| Amount format error | Try different amount formats (float vs BigInt) |
| Session issues | Clear session and login again |
| Network timeouts | Check INTMAX testnet status |

## 📊 **Debug Output Example**

When you run the debug endpoint, you should see:

```json
{
  "success": true,
  "debug": {
    "clientAddress": "T82j4LNnPVQ7YgcMDnQMHjKyezmsaNwoRT2xFcQLYwTnRcKeBroUiBD567J38g6avRQn9sosUrT8eMqzbvSq5Wpi12ZBZk7",
    "isLoggedIn": true,
    "tokensCount": 5,
    "balancesCount": 1,
    "ethTokenFound": true,
    "ethToken": {
      "symbol": "ETH",
      "tokenType": 0,
      "tokenIndex": 0,
      "contractAddress": "0x0000000000000000000000000000000000000000",
      "decimals": 18
    },
    "allTokens": [...],
    "allBalances": [...]
  }
}
```

## 🚀 **Next Steps**

1. **Test the Debug Endpoint**: Verify ETH token is found
2. **Test Deposit**: Try with small amounts
3. **Monitor Logs**: Check for detailed debugging info
4. **Report Results**: Let me know what the debug endpoint shows

The enhanced token matching should resolve the "Token ETH not found" issue. The debug tools will help us identify any remaining issues and provide detailed information about the token structure and matching process.

---

*These fixes provide robust token matching with comprehensive debugging capabilities to resolve the ETH token detection issue.* 