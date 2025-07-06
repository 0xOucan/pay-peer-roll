/**
 * Utility functions for Clear Signing JSON Generator
 * Based on ERC-7730 standard: https://github.com/LedgerHQ/clear-signing-erc7730-registry
 */

export interface ERC7730Schema {
  $schema: string
  context: {
    $id: string
    contract: {
      deployments: Array<{
        chainId: number
        address: string
      }>
      abi: any[]
      addressMatcher?: string | null
      factory?: any | null
    }
  }
  metadata: {
    owner: string
    info: {
      legalName: string
      url: string
    }
  }
  display: {
    formats: Record<string, any>
  }
}

/**
 * Available display formats for different parameter types
 * Based on Ledger Clear Signing documentation
 */
export const DISPLAY_FORMATS = {
  // Basic formats
  raw: {
    label: "Raw",
    description: "Display the raw value as-is",
    params: {}
  },
  amount: {
    label: "Amount",
    description: "Format as a token amount with decimals",
    params: {
      decimals: "number",
      unit: "string"
    }
  },
  addressName: {
    label: "Address Name",
    description: "Display address with ENS name resolution",
    params: {
      types: "array",
      sources: "array"
    }
  },
  date: {
    label: "Date",
    description: "Format timestamp as human-readable date",
    params: {
      encoding: "string" // "timestamp", "blockheight"
    }
  },
  percentage: {
    label: "Percentage",
    description: "Display as percentage value",
    params: {
      decimals: "number"
    }
  },
  
  // Advanced formats
  tokenAmount: {
    label: "Token Amount",
    description: "Format with token symbol and decimals",
    params: {
      token: "string",
      decimals: "number"
    }
  },
  duration: {
    label: "Duration",
    description: "Format as time duration",
    params: {
      unit: "string" // "seconds", "blocks"
    }
  }
} as const

/**
 * Common intent types for function categorization
 */
export const FUNCTION_INTENTS = [
  { value: "transfer", label: "Transfer", description: "Transfer tokens or assets" },
  { value: "approve", label: "Approve", description: "Approve spending allowance" },
  { value: "mint", label: "Mint", description: "Create new tokens or NFTs" },
  { value: "burn", label: "Burn", description: "Destroy tokens" },
  { value: "stake", label: "Stake", description: "Stake tokens for rewards" },
  { value: "unstake", label: "Unstake", description: "Withdraw staked tokens" },
  { value: "swap", label: "Swap", description: "Exchange one token for another" },
  { value: "deposit", label: "Deposit", description: "Deposit into protocol" },
  { value: "withdraw", label: "Withdraw", description: "Withdraw from protocol" },
  { value: "claim", label: "Claim", description: "Claim rewards or tokens" },
  { value: "vote", label: "Vote", description: "Participate in governance" },
  { value: "delegate", label: "Delegate", description: "Delegate voting power" },
  { value: "other", label: "Other", description: "Other function type" }
] as const

/**
 * Get default format based on Solidity type
 */
export function getDefaultFormat(solidityType: string): string {
  if (solidityType === "address") return "addressName"
  if (solidityType.includes("uint") || solidityType.includes("int")) return "amount"
  if (solidityType === "bytes" || solidityType.includes("bytes")) return "raw"
  if (solidityType === "bool") return "raw"
  if (solidityType === "string") return "raw"
  return "raw"
}

/**
 * Get default parameters for a format
 */
export function getDefaultParams(format: string, solidityType: string): any {
  switch (format) {
    case "addressName":
      return {
        types: ["eoa", "wallet", "contract"],
        sources: ["ens"]
      }
    case "amount":
      return {
        decimals: solidityType.includes("uint256") ? 18 : 0
      }
    case "date":
      return {
        encoding: "timestamp"
      }
    case "percentage":
      return {
        decimals: 2
      }
    default:
      return {}
  }
}

/**
 * Validate ERC-7730 JSON structure
 */
export function validateERC7730(json: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required top-level fields
  if (!json.$schema) errors.push("Missing $schema field")
  if (!json.context) errors.push("Missing context field")
  if (!json.metadata) errors.push("Missing metadata field")
  if (!json.display) errors.push("Missing display field")

  // Validate context
  if (json.context) {
    if (!json.context.$id) errors.push("Missing context.$id field")
    if (!json.context.contract) errors.push("Missing context.contract field")
    
    if (json.context.contract) {
      if (!json.context.contract.deployments || !Array.isArray(json.context.contract.deployments)) {
        errors.push("Missing or invalid context.contract.deployments field")
      } else {
        json.context.contract.deployments.forEach((deployment: any, index: number) => {
          if (typeof deployment.chainId !== "number") {
            errors.push(`Invalid chainId in deployment ${index}`)
          }
          if (typeof deployment.address !== "string" || !deployment.address.match(/^0x[a-fA-F0-9]{40}$/)) {
            errors.push(`Invalid address in deployment ${index}`)
          }
        })
      }
      
      if (!json.context.contract.abi || !Array.isArray(json.context.contract.abi)) {
        errors.push("Missing or invalid context.contract.abi field")
      }
    }
  }

  // Validate metadata
  if (json.metadata) {
    if (!json.metadata.owner) errors.push("Missing metadata.owner field")
    if (!json.metadata.info) errors.push("Missing metadata.info field")
    
    if (json.metadata.info) {
      if (!json.metadata.info.legalName) errors.push("Missing metadata.info.legalName field")
      if (!json.metadata.info.url) errors.push("Missing metadata.info.url field")
    }
  }

  // Validate display
  if (json.display) {
    if (!json.display.formats) errors.push("Missing display.formats field")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate function signature from ABI function
 */
export function generateFunctionSignature(func: any): string {
  const inputs = func.inputs?.map((input: any) => input.type).join(',') || ''
  return `${func.name}(${inputs})`
}

/**
 * Extract parameter paths from function inputs
 */
export function extractParameterPaths(func: any): string[] {
  return func.inputs?.map((input: any) => `#.${input.name}`) || []
}

/**
 * Common address types for addressName format
 */
export const ADDRESS_TYPES = [
  { value: "eoa", label: "EOA", description: "Externally Owned Account" },
  { value: "wallet", label: "Wallet", description: "Smart wallet contract" },
  { value: "contract", label: "Contract", description: "Smart contract" },
  { value: "token", label: "Token", description: "Token contract" },
  { value: "collection", label: "Collection", description: "NFT collection" }
] as const

/**
 * Common address sources for name resolution
 */
export const ADDRESS_SOURCES = [
  { value: "ens", label: "ENS", description: "Ethereum Name Service" },
  { value: "lens", label: "Lens", description: "Lens Protocol" },
  { value: "unstoppable", label: "Unstoppable", description: "Unstoppable Domains" }
] as const

/**
 * Generate a complete ERC-7730 JSON from form data
 */
export function generateERC7730JSON(data: any): ERC7730Schema {
  return {
    $schema: "https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/specs/erc7730-v1.schema.json",
    context: {
      $id: data.contractId,
      contract: {
        deployments: data.deployments,
        abi: data.abi,
        addressMatcher: null,
        factory: null
      }
    },
    metadata: {
      owner: data.owner,
      info: {
        legalName: data.legalName,
        url: data.url
      }
    },
    display: {
      formats: data.functionDisplays
    }
  }
}

/**
 * Example ERC-7730 templates for common contract types
 */
export const ERC7730_TEMPLATES = {
  erc20: {
    name: "ERC-20 Token",
    description: "Standard fungible token contract",
    functions: ["transfer", "approve", "transferFrom"]
  },
  erc721: {
    name: "ERC-721 NFT",
    description: "Non-fungible token contract",
    functions: ["transferFrom", "approve", "setApprovalForAll"]
  },
  defi: {
    name: "DeFi Protocol",
    description: "Decentralized finance protocol",
    functions: ["deposit", "withdraw", "stake", "unstake", "claim"]
  },
  governance: {
    name: "Governance Contract",
    description: "DAO governance contract",
    functions: ["propose", "vote", "execute", "delegate"]
  }
} as const 