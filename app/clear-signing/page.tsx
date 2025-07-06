"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { mainnet, polygon, arbitrum, optimism, base, sepolia, goerli, bsc, avalanche, fantom, type Chain } from "viem/chains"
import { 
  DISPLAY_FORMATS, 
  FUNCTION_INTENTS, 
  ADDRESS_TYPES, 
  ADDRESS_SOURCES,
  getDefaultFormat,
  getDefaultParams,
  validateERC7730,
  generateERC7730JSON,
  generateFunctionSignature
} from "@/lib/clear-signing-utils"

// Common chains for the selector
const SUPPORTED_CHAINS: Chain[] = [
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  sepolia,
  goerli,
  bsc,
  avalanche,
  fantom
]

// Types for the ERC-7730 JSON structure
interface ChainDeployment {
  chainId: number
  address: string
}

interface ABIFunction {
  type: string
  name: string
  inputs: Array<{
    name: string
    type: string
    internalType: string
  }>
  outputs: Array<{
    name: string
    type: string
    internalType: string
  }>
  stateMutability: string
}

interface DisplayField {
  label: string
  format: string
  params?: any
  path: string
}

interface FunctionDisplay {
  intent: string
  fields: DisplayField[]
  required: string[]
}

interface ClearSigningData {
  // Context
  contractId: string
  deployments: ChainDeployment[]
  abi: ABIFunction[]
  
  // Metadata
  owner: string
  legalName: string
  url: string
  
  // Display
  functionDisplays: Record<string, FunctionDisplay>
}

export default function ClearSigningGenerator() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<ClearSigningData>({
    contractId: "",
    deployments: [],
    abi: [],
    owner: "",
    legalName: "",
    url: "",
    functionDisplays: {}
  })
  
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [contractAddress, setContractAddress] = useState("")
  const [abiInput, setAbiInput] = useState("")
  const [chainSearch, setChainSearch] = useState("")
  const [generatedJSON, setGeneratedJSON] = useState("")

  // Filter chains based on search
  const filteredChains = SUPPORTED_CHAINS.filter(chain => 
    chain.name.toLowerCase().includes(chainSearch.toLowerCase()) ||
    chain.id.toString().includes(chainSearch)
  )

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleChainSelect = (chain: Chain) => {
    setSelectedChain(chain)
    setData(prev => ({
      ...prev,
      deployments: [{
        chainId: chain.id,
        address: contractAddress
      }]
    }))
  }

  const handleAddressChange = (address: string) => {
    setContractAddress(address)
    setData(prev => ({
      ...prev,
      deployments: [{
        chainId: selectedChain?.id || 1,
        address
      }]
    }))
  }

  const handleABIChange = (abiText: string) => {
    setAbiInput(abiText)
    try {
      const parsedABI = JSON.parse(abiText)
      if (Array.isArray(parsedABI)) {
        setData(prev => ({
          ...prev,
          abi: parsedABI.filter(item => item.type === "function")
        }))
      }
    } catch (error) {
      console.error("Invalid ABI JSON:", error)
    }
  }

  const generateJSON = () => {
    const erc7730JSON = generateERC7730JSON(data)
    const validation = validateERC7730(erc7730JSON)
    
    if (!validation.valid) {
      console.error("Generated JSON validation failed:", validation.errors)
      alert("Generated JSON has validation errors:\n" + validation.errors.join("\n"))
      return
    }
    
    setGeneratedJSON(JSON.stringify(erc7730JSON, null, 2))
  }

  const downloadJSON = () => {
    const blob = new Blob([generatedJSON], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${data.contractId}-clear-signing.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-[#008080] p-4"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #008080,
            #008080 2px,
            #006666 2px,
            #006666 4px
          )`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-lg">
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#0000FF] to-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔍</span>
                <span className="font-bold text-sm">Clear Signing JSON Generator - ERC-7730 Builder</span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs hover:bg-[#E0E0E0]"
                  title="Back to Dashboard"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-[#C0C0C0] border-b border-[#808080] p-2">
              <div className="flex items-center justify-between text-sm text-black mb-2">
                <span>Step {currentStep} of 5</span>
                <span>{Math.round((currentStep / 5) * 100)}% Complete</span>
              </div>
              <div className="bg-white border-2 border-inset h-4">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step 1: Chain Selection */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">📡 Select Blockchain Network</h2>
                  <p className="text-black mb-6">Choose the blockchain network where your smart contract is deployed.</p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-black mb-2">Search Chains:</label>
                    <input
                      type="text"
                      value={chainSearch}
                      onChange={(e) => setChainSearch(e.target.value)}
                      placeholder="Search by name or chain ID..."
                      className="w-full p-2 border-2 border-inset bg-white text-black"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredChains.slice(0, 20).map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => handleChainSelect(chain)}
                        className={`p-4 border-2 text-left transition-all ${
                          selectedChain?.id === chain.id 
                            ? "border-inset bg-[#E0E0E0]" 
                            : "border-outset bg-[#C0C0C0] hover:bg-[#E0E0E0]"
                        }`}
                      >
                        <div className="font-bold text-black">{chain.name}</div>
                        <div className="text-sm text-gray-600">Chain ID: {chain.id}</div>
                        <div className="text-xs text-gray-500">{chain.nativeCurrency.symbol}</div>
                      </button>
                    ))}
                  </div>

                  {selectedChain && (
                    <div className="mt-4 p-4 bg-green-100 border-2 border-inset">
                      <div className="text-sm text-green-800">
                        ✅ Selected: <strong>{selectedChain.name}</strong> (Chain ID: {selectedChain.id})
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Contract Details */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">📋 Contract Information</h2>
                  <p className="text-black mb-6">Enter your smart contract details and ABI.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Contract Address:</label>
                      <input
                        type="text"
                        value={contractAddress}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-2 border-2 border-inset bg-white text-black font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Contract ABI (JSON):</label>
                      <textarea
                        value={abiInput}
                        onChange={(e) => handleABIChange(e.target.value)}
                        placeholder="Paste your contract ABI JSON here..."
                        rows={12}
                        className="w-full p-2 border-2 border-inset bg-white text-black font-mono text-xs"
                      />
                    </div>

                    {data.abi.length > 0 && (
                      <div className="p-4 bg-green-100 border-2 border-inset">
                        <div className="text-sm text-green-800">
                          ✅ Found {data.abi.length} function(s) in ABI:
                          <ul className="mt-2 list-disc list-inside">
                            {data.abi.slice(0, 5).map((func, index) => (
                              <li key={index}>{func.name}()</li>
                            ))}
                            {data.abi.length > 5 && <li>... and {data.abi.length - 5} more</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Protocol Metadata */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">🏢 Protocol Information</h2>
                  <p className="text-black mb-6">Provide information about your protocol or dApp.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Contract ID:</label>
                      <input
                        type="text"
                        value={data.contractId}
                        onChange={(e) => setData(prev => ({ ...prev, contractId: e.target.value }))}
                        placeholder="e.g., UNISWAP_V3, AAVE_V2"
                        className="w-full p-2 border-2 border-inset bg-white text-black"
                      />
                      <div className="text-xs text-gray-600 mt-1">A unique identifier for your contract</div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Owner:</label>
                      <input
                        type="text"
                        value={data.owner}
                        onChange={(e) => setData(prev => ({ ...prev, owner: e.target.value }))}
                        placeholder="e.g., Uniswap Labs"
                        className="w-full p-2 border-2 border-inset bg-white text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Legal Name:</label>
                      <input
                        type="text"
                        value={data.legalName}
                        onChange={(e) => setData(prev => ({ ...prev, legalName: e.target.value }))}
                        placeholder="e.g., Uniswap Labs Inc."
                        className="w-full p-2 border-2 border-inset bg-white text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Website URL:</label>
                      <input
                        type="url"
                        value={data.url}
                        onChange={(e) => setData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full p-2 border-2 border-inset bg-white text-black"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Function Display Configuration */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">⚙️ Configure Function Displays</h2>
                  <p className="text-black mb-6">Configure how each function should be displayed to users.</p>

                  <div className="space-y-6">
                    {data.abi.map((func, index) => (
                      <FunctionDisplayConfig
                        key={index}
                        func={func}
                        onUpdate={(display) => {
                          const signature = `${func.name}(${func.inputs.map(i => i.type).join(',')})`
                          setData(prev => ({
                            ...prev,
                            functionDisplays: {
                              ...prev.functionDisplays,
                              [signature]: display
                            }
                          }))
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Generate and Export */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-2xl font-bold text-black mb-4">📄 Generate ERC-7730 JSON</h2>
                  <p className="text-black mb-6">Review and download your Clear Signing metadata file.</p>

                  <div className="mb-6">
                    <button
                      onClick={generateJSON}
                      className="bg-blue-600 text-white px-6 py-2 border-2 border-outset hover:bg-blue-700 font-bold"
                    >
                      🔄 Generate JSON
                    </button>
                  </div>

                  {generatedJSON && (
                    <div>
                      <div className="mb-4">
                        <button
                          onClick={downloadJSON}
                          className="bg-green-600 text-white px-6 py-2 border-2 border-outset hover:bg-green-700 font-bold"
                        >
                          💾 Download JSON File
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-black mb-2">Generated ERC-7730 JSON:</label>
                        <textarea
                          value={generatedJSON}
                          readOnly
                          rows={20}
                          className="w-full p-2 border-2 border-inset bg-white text-black font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`px-6 py-2 border-2 font-bold ${
                    currentStep === 1
                      ? "border-inset bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "border-outset bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                  }`}
                >
                  ← Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentStep === 5 || (currentStep === 1 && !selectedChain) || (currentStep === 2 && (!contractAddress || data.abi.length === 0))}
                  className={`px-6 py-2 border-2 font-bold ${
                    currentStep === 5 || (currentStep === 1 && !selectedChain) || (currentStep === 2 && (!contractAddress || data.abi.length === 0))
                      ? "border-inset bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "border-outset bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                  }`}
                >
                  {currentStep === 5 ? "Complete" : "Next →"}
                </button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1">
              <div className="flex items-center justify-between text-xs text-black">
                <div className="flex items-center space-x-4">
                  <span>🔍 Clear Signing Generator</span>
                  <span>📋 ERC-7730 Standard</span>
                  <span>🚀 Ready for Ledger</span>
                </div>
                <div>Step {currentStep}/5</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Component for configuring individual function displays
function FunctionDisplayConfig({ 
  func, 
  onUpdate 
}: { 
  func: ABIFunction
  onUpdate: (display: FunctionDisplay) => void 
}) {
  const [intent, setIntent] = useState("transfer")
  const [fields, setFields] = useState<DisplayField[]>([])

  useEffect(() => {
    // Initialize fields based on function inputs using utility functions
    const initialFields = func.inputs.map(input => ({
      label: input.name.charAt(0).toUpperCase() + input.name.slice(1),
      format: getDefaultFormat(input.type),
      params: getDefaultParams(getDefaultFormat(input.type), input.type),
      path: `#.${input.name}`
    }))
    setFields(initialFields)
  }, [func])

  useEffect(() => {
    onUpdate({
      intent,
      fields,
      required: fields.map(f => f.path)
    })
  }, [intent, fields, onUpdate])

  const updateField = (index: number, updates: Partial<DisplayField>) => {
    setFields(prev => prev.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ))
  }

  const updateFieldParams = (index: number, paramKey: string, paramValue: any) => {
    setFields(prev => prev.map((field, i) => 
      i === index ? { 
        ...field, 
        params: { ...field.params, [paramKey]: paramValue } 
      } : field
    ))
  }

  return (
    <div className="border-2 border-inset p-4 bg-white">
      <h3 className="font-bold text-black mb-4">
        {func.name}() 
        <span className="text-sm font-normal text-gray-600 ml-2">
          ({func.inputs.length} parameter{func.inputs.length !== 1 ? 's' : ''})
        </span>
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-bold text-black mb-2">Function Intent:</label>
        <select
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          className="p-2 border-2 border-inset bg-white text-black"
        >
          {FUNCTION_INTENTS.map(intent => (
            <option key={intent.value} value={intent.value}>
              {intent.label} - {intent.description}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-black">Parameter Display Configuration:</h4>
        {fields.map((field, index) => (
          <div key={index} className="border border-gray-300 p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Display Label:</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  className="w-full p-1 border border-gray-400 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Display Format:</label>
                <select
                  value={field.format}
                  onChange={(e) => {
                    const newFormat = e.target.value
                    updateField(index, { 
                      format: newFormat,
                      params: getDefaultParams(newFormat, func.inputs[index].type)
                    })
                  }}
                  className="w-full p-1 border border-gray-400 text-xs"
                >
                  {Object.entries(DISPLAY_FORMATS).map(([key, format]) => (
                    <option key={key} value={key}>
                      {format.label} - {format.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 mb-2">
              Parameter: <code>{func.inputs[index].name}</code> 
              (type: <code>{func.inputs[index].type}</code>)
            </div>

            {/* Format-specific parameters */}
            {field.format === "addressName" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Address Types:</label>
                  <div className="space-y-1">
                    {ADDRESS_TYPES.map(type => (
                      <label key={type.value} className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={field.params?.types?.includes(type.value) || false}
                          onChange={(e) => {
                            const currentTypes = field.params?.types || []
                            const newTypes = e.target.checked
                              ? [...currentTypes, type.value]
                              : currentTypes.filter((t: string) => t !== type.value)
                            updateFieldParams(index, "types", newTypes)
                          }}
                          className="mr-1"
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Name Sources:</label>
                  <div className="space-y-1">
                    {ADDRESS_SOURCES.map(source => (
                      <label key={source.value} className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={field.params?.sources?.includes(source.value) || false}
                          onChange={(e) => {
                            const currentSources = field.params?.sources || []
                            const newSources = e.target.checked
                              ? [...currentSources, source.value]
                              : currentSources.filter((s: string) => s !== source.value)
                            updateFieldParams(index, "sources", newSources)
                          }}
                          className="mr-1"
                        />
                        {source.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {field.format === "amount" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Decimals:</label>
                  <input
                    type="number"
                    value={field.params?.decimals || 0}
                    onChange={(e) => updateFieldParams(index, "decimals", parseInt(e.target.value))}
                    className="w-full p-1 border border-gray-400 text-xs"
                    min="0"
                    max="18"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Unit (optional):</label>
                  <input
                    type="text"
                    value={field.params?.unit || ""}
                    onChange={(e) => updateFieldParams(index, "unit", e.target.value)}
                    placeholder="e.g., ETH, USDC"
                    className="w-full p-1 border border-gray-400 text-xs"
                  />
                </div>
              </div>
            )}

            {field.format === "date" && (
              <div>
                <label className="block text-xs font-bold text-black mb-1">Encoding:</label>
                <select
                  value={field.params?.encoding || "timestamp"}
                  onChange={(e) => updateFieldParams(index, "encoding", e.target.value)}
                  className="p-1 border border-gray-400 text-xs"
                >
                  <option value="timestamp">Timestamp (seconds)</option>
                  <option value="blockheight">Block Height</option>
                </select>
              </div>
            )}

            {field.format === "percentage" && (
              <div>
                <label className="block text-xs font-bold text-black mb-1">Decimal Places:</label>
                <input
                  type="number"
                  value={field.params?.decimals || 2}
                  onChange={(e) => updateFieldParams(index, "decimals", parseInt(e.target.value))}
                  className="w-full p-1 border border-gray-400 text-xs"
                  min="0"
                  max="4"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 