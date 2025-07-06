# INTMAX Integration Documentation

## Overview

This document describes the integration of INTMAX privacy mixing technology into the Pay-Peer-Roll application. INTMAX provides privacy-preserving transactions on Ethereum through zero-knowledge proofs and mixing protocols.

## Features Implemented

### 1. INTMAX Connection Management
- **Login/Logout**: Connect to INTMAX network using private key authentication
- **Balance Monitoring**: View INTMAX token balances in real-time
- **Session Management**: Secure session handling with automatic logout

### 2. Deposit Functionality
- **ETH Deposits**: Deposit native ETH from Sepolia testnet to INTMAX
- **USDC Deposits**: Deposit USDC tokens to INTMAX for privacy mixing
- **Transaction Tracking**: Monitor deposit transactions with hash tracking

### 3. Withdrawal Functionality
- **ETH Withdrawals**: Withdraw ETH from INTMAX back to Sepolia addresses
- **USDC Withdrawals**: Withdraw USDC tokens to specified addresses
- **Address Validation**: Ensure all recipient addresses are valid Ethereum addresses

### 4. Multi-Address Distribution
- **Batch Sending**: Send tokens to multiple addresses in a single operation
- **Privacy Mixing**: Leverage INTMAX's privacy features for anonymous distributions
- **Dynamic Recipients**: Add/remove recipients dynamically in the UI
- **Amount Validation**: Validate amounts and addresses before sending

## Technical Architecture

### Frontend Components

#### `/app/intmax/page.tsx`
Main INTMAX integration page with three tabs:
- **Deposit Tab**: Interface for depositing ETH/USDC to INTMAX
- **Withdraw Tab**: Interface for withdrawing tokens from INTMAX
- **Multi-Send Tab**: Interface for distributing tokens to multiple addresses

### API Routes

#### `/app/api/intmax/login/route.ts`
- Initializes INTMAX client connection
- Authenticates using environment variables
- Returns user address and token balances

#### `/app/api/intmax/logout/route.ts`
- Safely disconnects from INTMAX network
- Clears session data

#### `/app/api/intmax/balances/route.ts`
- Fetches current INTMAX token balances
- Supports real-time balance updates

#### `/app/api/intmax/deposit/route.ts`
- Handles ETH and USDC deposits to INTMAX
- Validates amounts and token types
- Returns transaction hashes

#### `/app/api/intmax/withdraw/route.ts`
- Processes withdrawals from INTMAX to Sepolia
- Validates recipient addresses
- Supports both ETH and USDC withdrawals

#### `/app/api/intmax/multi-send/route.ts`
- Handles multi-address token distribution
- Validates all recipients and amounts
- Provides batch transaction processing

### Utility Functions

#### `/lib/intmax-utils.ts`
- INTMAX client initialization
- Address validation utilities
- Token configuration management
- Error handling helpers

## Environment Configuration

Required environment variables in `.env`:

```bash
# Ethereum private key (must start with 0x)
ETH_PRIVATE_KEY="0x..."

# Sepolia RPC URL (e.g., Infura, Alchemy, or public RPC)
L1_RPC_URL="https://sepolia.gateway.tenderly.co"
```

## Supported Tokens

### ETH (Native Ethereum)
- **Symbol**: ETH
- **Decimals**: 18
- **Network**: Sepolia Testnet
- **Type**: Native token

### USDC (USD Coin)
- **Symbol**: USDC
- **Decimals**: 6
- **Contract**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- **Network**: Sepolia Testnet

## User Interface

### Dashboard Integration
The INTMAX integration is accessible from the main dashboard as a new application tile:
- **Title**: "INTMAX Integration"
- **Subtitle**: "⚡ Privacy Mixing"
- **Description**: "Deposit, withdraw, and distribute with privacy"
- **Icon**: 🔒

### Windows 95 Theme
The INTMAX page maintains the retro Windows 95 aesthetic:
- Classic window chrome with title bar
- Inset/outset borders for authentic look
- Teal gradient background pattern
- Monospace fonts for addresses and transaction hashes

## Privacy Features

### Zero-Knowledge Proofs
INTMAX uses zero-knowledge proofs to ensure transaction privacy:
- **Deposit Privacy**: Deposits are mixed with other users' funds
- **Withdrawal Privacy**: Withdrawals cannot be linked to original deposits
- **Amount Privacy**: Transaction amounts are hidden from observers

### Mixing Protocol
The multi-send feature leverages INTMAX's mixing protocol:
- **Input Mixing**: Combines multiple inputs for anonymity
- **Output Distribution**: Distributes to multiple outputs simultaneously
- **Timing Obfuscation**: Randomizes transaction timing

## Security Considerations

### Private Key Management
- Private keys are stored securely in environment variables
- Never expose private keys in client-side code
- Use secure RPC endpoints for network communication

### Address Validation
- All Ethereum addresses are validated using regex patterns
- Invalid addresses are rejected before API calls
- Client-side and server-side validation for security

### Transaction Security
- All transactions are signed using the configured private key
- Transaction hashes are provided for verification
- Error handling prevents information leakage

## Testing

### Testnet Environment
- All operations use Sepolia testnet
- Safe for testing without real funds
- USDC contract specifically deployed for testing

### Mock Responses
Currently implemented with mock responses for UI testing:
- Deposit operations return simulated transaction hashes
- Withdrawal operations simulate successful transfers
- Multi-send operations return batch transaction results

### Integration Testing
To test the integration:
1. Ensure environment variables are configured
2. Have Sepolia ETH and USDC in your wallet
3. Access the INTMAX page from the dashboard
4. Test deposit, withdrawal, and multi-send operations

## Future Enhancements

### Real SDK Integration
- Replace mock responses with actual INTMAX SDK calls
- Implement real deposit/withdrawal functionality
- Add transaction status monitoring

### Advanced Features
- **Transaction History**: View past INTMAX transactions
- **Batch Operations**: Queue multiple operations
- **Scheduled Distributions**: Time-delayed multi-sends
- **Privacy Analytics**: Track mixing effectiveness

### UI Improvements
- **Transaction Status**: Real-time transaction monitoring
- **Gas Estimation**: Show estimated transaction costs
- **Confirmation Dialogs**: Enhanced user confirmation flows
- **Progress Indicators**: Visual feedback for long operations

## Troubleshooting

### Common Issues

#### "Missing environment variables"
- Ensure `ETH_PRIVATE_KEY` and `L1_RPC_URL` are set in `.env`
- Verify private key format starts with `0x`

#### "Invalid address" errors
- Check that addresses are valid Ethereum addresses
- Ensure addresses are 42 characters long (including 0x prefix)

#### Connection timeouts
- Verify RPC URL is accessible and responsive
- Check network connectivity to Sepolia testnet

### Debug Mode
Enable detailed logging by checking browser console:
- Login/logout operations are logged
- API requests and responses are tracked
- Error details are provided for debugging

## Support

For technical support or questions about the INTMAX integration:
- Check the browser console for detailed error messages
- Verify environment configuration
- Test with small amounts first
- Contact the development team for assistance

---

*This integration provides a foundation for privacy-preserving payroll distribution using INTMAX technology. The modular architecture allows for easy extension and customization based on specific requirements.* 