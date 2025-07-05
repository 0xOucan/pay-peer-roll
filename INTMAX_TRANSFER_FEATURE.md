# INTMAX-to-INTMAX Transfer Feature

## Overview
This feature enables users to transfer tokens directly between INTMAX addresses using the `broadcastTransaction` function. This provides privacy-preserving transfers within the INTMAX network without needing to go through external blockchain networks.

## Key Features

### 🔄 Direct INTMAX Transfers
- Transfer tokens between INTMAX addresses (T format)
- Uses INTMAX's privacy mixing technology
- No external blockchain interaction required
- Supports multiple recipients in a single transaction

### 🛡️ Privacy Protection
- All transfers use INTMAX's privacy mixing protocol
- Transaction amounts and recipients are protected
- Utilizes zero-knowledge proofs for privacy preservation

### 💡 User-Friendly Interface
- Simple tab-based interface in the INTMAX page
- Real-time address validation for INTMAX addresses
- Support for multiple recipients
- Automatic total calculation
- Clear error messages and success feedback

## Technical Implementation

### API Endpoint
- **Route**: `/api/intmax/transfer`
- **Method**: POST
- **Function**: Uses INTMAX SDK's `broadcastTransaction` function

### Request Format
```json
{
  "recipients": [
    {
      "address": "T6ubiG36LmNce6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcFtvXnBB3bqice6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcB3prnCZ",
      "amount": "0.000001"
    }
  ],
  "token": "ETH",
  "tokenAddress": null
}
```

### Response Format
```json
{
  "success": true,
  "transactions": [
    {
      "txTreeRoot": "0x52146f411e84ccba11e0887a0780a558f41042300a1515c7ff2cb7e1dd8b8c77",
      "transferDigest": "0x0fddb7a7b18025c8a2242a66c8c73100f272ba0fc0064c65d725badcc5f9df66",
      "recipient": "T6ubiG36LmNce6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcB3prnCZ",
      "amount": "0.000001",
      "status": "success"
    }
  ],
  "txTreeRoot": "0x52146f411e84ccba11e0887a0780a558f41042300a1515c7ff2cb7e1dd8b8c77",
  "transferDigests": ["0x0fddb7a7b18025c8a2242a66c8c73100f272ba0fc0064c65d725badcc5f9df66"],
  "token": "ETH",
  "totalRecipients": 1,
  "message": "Successfully transferred ETH to 1 INTMAX address(es) with privacy mixing"
}
```

## Address Validation

### INTMAX Address Format
- **Format**: Starts with 'T' followed by alphanumeric characters
- **Length**: Minimum 50 characters
- **Example**: `T6ubiG36LmNce6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcFtvXnBB3bqice6uzcJU3h5JR5FWa72jBBLUGmEPx5VXcB3prnCZ`

### Validation Rules
- Address must start with 'T'
- Address must be longer than 50 characters
- Real-time validation with visual feedback
- Clear error messages for invalid addresses

## UI Components

### New Tab: "🔄 INTMAX Transfer"
- Added as 4th tab in the INTMAX integration page
- Dedicated interface for INTMAX-to-INTMAX transfers
- Clear distinction from external multi-send functionality

### Features
- **Token Selection**: Choose between ETH and USDC
- **Multi-Recipient Support**: Add multiple recipients in one transaction
- **Address Validation**: Real-time validation with visual feedback
- **Amount Calculation**: Automatic total calculation
- **Summary Display**: Shows total amount and recipient count
- **Error Handling**: Clear error messages and success feedback

## Differences from Multi-Send

| Feature | Multi-Send | INTMAX Transfer |
|---------|------------|-----------------|
| **Address Format** | Ethereum (0x...) | INTMAX (T...) |
| **Network** | External blockchain | INTMAX network |
| **Privacy** | Standard transaction | Privacy mixing |
| **Function** | External withdrawal | Internal transfer |
| **Validation** | Ethereum address | INTMAX address |

## Token Support

### Currently Supported
- **ETH**: Native Ethereum token
- **USDC**: USDC token on testnet

### Token Resolution
- Prioritizes balance data for complete token information
- Falls back to tokens list if not found in balances
- Ensures `tokenType` property is properly set
- Supports both symbol and contract address matching

## Error Handling

### Client-Side Validation
- Invalid INTMAX address format
- Missing or invalid amounts
- Empty recipients list
- Missing token selection

### Server-Side Validation
- Token not found in available tokens
- Insufficient balance (handled by INTMAX SDK)
- Network connectivity issues
- INTMAX session management

## Testing

### Test Script
- **File**: `scripts/test-intmax-transfer.js`
- **Tests**: Address validation, token validation, successful transfers
- **Usage**: `node scripts/test-intmax-transfer.js`

### Test Cases
1. **Valid Transfer**: Test with proper INTMAX address and amount
2. **Invalid Address**: Test with Ethereum address (should fail)
3. **Missing Token**: Test without token specification (should fail)
4. **Multiple Recipients**: Test with multiple valid recipients

## Security Features

### Address Validation
- Strict INTMAX address format checking
- Prevention of cross-network address confusion
- Clear error messages for invalid formats

### Transaction Safety
- Uses INTMAX SDK's built-in validation
- Proper token matching and verification
- Session management for authenticated transfers

## Future Enhancements

### Potential Improvements
- **Address Book**: Save frequently used INTMAX addresses
- **Transaction History**: View past INTMAX transfers
- **Advanced Privacy**: Additional privacy options
- **Batch Operations**: Support for larger recipient lists
- **Token Management**: Support for custom tokens

### Integration Options
- **Contact Management**: Integration with user contact systems
- **Recurring Transfers**: Scheduled automatic transfers
- **Multi-Token**: Support for multiple token types in one transaction

## Usage Instructions

1. **Connect to INTMAX**: Use the "Connect to INTMAX" button
2. **Select Transfer Tab**: Click on "🔄 INTMAX Transfer"
3. **Choose Token**: Select ETH or USDC
4. **Add Recipients**: Enter INTMAX addresses (starting with 'T')
5. **Set Amounts**: Enter transfer amounts for each recipient
6. **Review Summary**: Check total amount and recipient count
7. **Execute Transfer**: Click the transfer button
8. **Confirm Success**: Wait for transaction confirmation

## Technical Notes

### INTMAX SDK Integration
- Uses `broadcastTransaction` function for transfers
- Implements proper token structure with all required fields
- Handles session management through global client instance
- Supports both single and multiple recipient transfers

### Performance Optimizations
- Parallel token data fetching
- Efficient address validation
- Optimized UI updates
- Minimal re-rendering on state changes

## Troubleshooting

### Common Issues
1. **Invalid Address**: Ensure address starts with 'T' and is long enough
2. **Token Not Found**: Check if token is available in your balance
3. **Network Issues**: Verify INTMAX connection status
4. **Insufficient Balance**: Ensure you have enough tokens for transfer

### Debug Tools
- Use `/api/intmax/debug` for detailed token information
- Check `/api/intmax/status` for connection health
- Review browser console for detailed error messages 