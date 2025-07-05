# Pay-Peer-Roll Payroll Distribution

A decentralized payroll distribution system that uses blockchain technology for transparent, efficient payments.

## Overview

Pay-Peer-Roll allows organizations to distribute payroll using blockchain technology. The application features:

- Authentication using Ledger hardware wallets or Rabby Wallet
- Dashboard for payroll distribution management
- Blockchain-based payment system for transparency and security
- Windows 95-inspired UI design for a nostalgic feel

## Current Status

The application currently includes a working authentication flow with Rabby wallet integration. The Ledger integration is partially implemented, with the foundation set up but requiring additional dependencies to be properly configured.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd payroll-distributor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Ledger Integration Status

The Ledger integration is currently implemented as a mock system. To properly integrate with Ledger hardware wallets, the following steps need to be completed:

### Next Steps for Ledger Integration

1. **Install Required Dependencies**:
   ```bash
   npm install @ledgerhq/device-management-kit@0.7.0 @ledgerhq/device-transport-kit-web-hid@1.1.0 @ledgerhq/device-signer-kit-ethereum@1.5.0 @ledgerhq/context-module rxjs@7.8.2 --legacy-peer-deps
   ```

2. **Update the Ledger Integration Implementation**:
   - The current implementation in `lib/ledger-integration.ts` is a mock.
   - To implement the full Ledger integration, review the commented code in the file and follow the Ledger Device Management Kit documentation.

3. **Resolve API Differences**:
   - There are some inconsistencies between the Ledger API documentation and the actual implementation.
   - You'll need to check the actual exports from the packages to match the correct method names.

4. **Browser Compatibility**:
   - WebHID is only supported in Chromium-based browsers (Chrome, Edge, Opera).
   - Ensure to add appropriate browser compatibility checks.

## Using the Application

1. **Authentication**:
   - Connect your Rabby Wallet or Ledger device
   - Sign the welcome message to authenticate
   - Access the dashboard after successful authentication

2. **Dashboard**:
   - View payroll distribution history
   - Create new payroll distributions
   - Manage recipient addresses

3. **Settings**:
   - Configure blockchain network settings
   - Set up payment preferences
   - Manage authentication methods

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
