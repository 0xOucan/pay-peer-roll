# Clear Signing JSON Generator

## Overview

The Clear Signing JSON Generator is a comprehensive tool for creating ERC-7730 compliant metadata files for Ledger's [Clear Signing](https://developers.ledger.com/docs/clear-signing/understanding/what-is-it) functionality. This tool transforms blockchain transaction signing from unreadable raw data into human-readable information.

## 🔍 What is Clear Signing?

Clear Signing is a technology that allows users to verify exactly what they're approving before signing a transaction or message. Instead of showing cryptic hexadecimal strings, it presents transaction details in plain language.

### Benefits:
- **Enhanced Security**: Users can verify transaction content before signing
- **Improved Usability**: Transaction details in human-readable format
- **Reduced Fraud**: Clear information helps users avoid malicious transactions
- **Better UX**: Increased user confidence in blockchain interactions

## 🚀 Features

### **Step-by-Step Wizard Interface**
- **Step 1**: Blockchain network selection (using Viem chains)
- **Step 2**: Contract details and ABI input
- **Step 3**: Protocol metadata configuration
- **Step 4**: Function display configuration
- **Step 5**: JSON generation and export

### **Advanced Configuration Options**
- **Display Formats**: Raw, Amount, Address Name, Date, Percentage, Token Amount, Duration
- **Function Intents**: Transfer, Approve, Mint, Burn, Stake, Unstake, Swap, Deposit, Withdraw, Claim, Vote, Delegate
- **Address Types**: EOA, Wallet, Contract, Token, Collection
- **Name Sources**: ENS, Lens Protocol, Unstoppable Domains

### **Built-in Validation**
- ERC-7730 schema compliance checking
- Address format validation
- ABI structure verification
- Required field validation

## 🛠️ Technical Implementation

### **Core Files**
```
app/clear-signing/page.tsx        # Main generator interface
lib/clear-signing-utils.ts        # Utility functions and constants
scripts/test-clear-signing.js     # Comprehensive test suite
```

### **Dependencies**
- **Viem**: For blockchain network definitions
- **React**: For UI components
- **TypeScript**: For type safety
- **Next.js**: For routing and server-side functionality

### **Supported Chains**
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- Sepolia (Testnet)
- Goerli (Testnet)
- Binance Smart Chain
- Avalanche
- Fantom

## 📋 Usage Guide

### **1. Access the Tool**
Navigate to the dashboard and click on "Clear Signing Generator"

### **2. Select Blockchain Network**
- Search for your target blockchain
- Select from supported networks
- Chain ID is automatically populated

### **3. Configure Contract**
- Enter contract address (0x...)
- Paste contract ABI JSON
- Tool automatically parses functions

### **4. Set Protocol Information**
- Contract ID (unique identifier)
- Owner name
- Legal name
- Website URL

### **5. Configure Function Displays**
For each contract function, configure:
- **Intent**: Function purpose (transfer, approve, etc.)
- **Parameter Labels**: Human-readable names
- **Display Formats**: How parameters should be shown
- **Format Parameters**: Additional formatting options

### **6. Generate and Export**
- Click "Generate JSON" to create ERC-7730 file
- Built-in validation ensures compliance
- Download the generated JSON file

## 🔧 ERC-7730 Structure

The generated JSON follows the ERC-7730 standard with these sections:

### **Context**
```json
{
  "context": {
    "$id": "CONTRACT_ID",
    "contract": {
      "deployments": [
        {
          "chainId": 1,
          "address": "0x..."
        }
      ],
      "abi": [...]
    }
  }
}
```

### **Metadata**
```json
{
  "metadata": {
    "owner": "Protocol Name",
    "info": {
      "legalName": "Legal Entity Name",
      "url": "https://protocol.com"
    }
  }
}
```

### **Display**
```json
{
  "display": {
    "formats": {
      "functionName(type1,type2)": {
        "intent": "transfer",
        "fields": [
          {
            "label": "Recipient",
            "format": "addressName",
            "params": {
              "types": ["eoa", "wallet"],
              "sources": ["ens"]
            },
            "path": "#.to"
          }
        ],
        "required": ["#.to"]
      }
    }
  }
}
```

## 🎨 Display Formats

### **Basic Formats**
- **Raw**: Display value as-is
- **Amount**: Token amount with decimals
- **Address Name**: Address with ENS resolution
- **Date**: Human-readable timestamps
- **Percentage**: Percentage values

### **Advanced Formats**
- **Token Amount**: With symbol and decimals
- **Duration**: Time duration formatting

### **Format Parameters**
Each format supports specific parameters:
- **Amount**: decimals, unit
- **Address Name**: types, sources
- **Date**: encoding (timestamp/blockheight)
- **Percentage**: decimal places

## 🧪 Testing

Run the comprehensive test suite:
```bash
node scripts/test-clear-signing.js
```

The test verifies:
- File structure integrity
- Utility function availability
- Dashboard integration
- ERC-7730 schema compliance
- Component functionality
- Viem integration
- JSON generation capability

## 📚 References

- [ERC-7730 Standard](https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/specs/erc-7730.md)
- [Ledger Clear Signing Documentation](https://developers.ledger.com/docs/clear-signing/understanding/what-is-it)
- [Viem Chains](https://github.com/wevm/viem/blob/main/src/chains/index.ts)
- [Clear Signing Registry](https://github.com/LedgerHQ/clear-signing-erc7730-registry)

## 🔄 Workflow

1. **Generate**: Create ERC-7730 JSON using the tool
2. **Validate**: Built-in validation ensures compliance
3. **Submit**: Submit to Ledger's Clear Signing Registry
4. **Review**: Ledger validates the submission
5. **Deploy**: Metadata becomes available to all compatible wallets

## 🎯 Example Use Cases

### **DeFi Protocol**
- Swap functions show token pairs and amounts
- Staking functions display rewards and lock periods
- Lending functions show collateral and interest rates

### **NFT Marketplace**
- Purchase functions show NFT details and prices
- Auction functions display bid amounts and deadlines
- Transfer functions show recipient and token IDs

### **Governance DAO**
- Voting functions show proposal details
- Delegation functions display voting power transfer
- Execution functions show governance actions

## 🚀 Future Enhancements

- **Template Library**: Pre-built templates for common contract types
- **ABI Import**: Direct import from Etherscan/block explorers
- **Batch Processing**: Generate multiple contracts at once
- **Preview Mode**: Real-time preview of how transactions will appear
- **Integration**: Direct submission to Ledger registry

## 💡 Tips for Best Results

1. **Use Descriptive Labels**: Make parameter names user-friendly
2. **Choose Appropriate Formats**: Match format to parameter type
3. **Set Correct Decimals**: Ensure token amounts display properly
4. **Enable ENS Resolution**: For better address readability
5. **Test Thoroughly**: Validate generated JSON before submission

---

**Built with ❤️ for the Ledger Clear Signing ecosystem** 