"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIntMaxClient } from "@/hooks/useIntMaxClient"

// USDC contract address on Sepolia
const USDC_SEPOLIA_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

interface IntmaxRecipient {
  id: string
  address: string
  amount: string
  isValid: boolean
}

export default function IntmaxClientComponent() {
  const router = useRouter()
  const {
    client,
    isLoggedIn,
    loading,
    error,
    balances,
    clientAddress,
    initializeClient,
    login,
    logout,
    fetchBalances,
    deposit,
    withdraw,
    transfer,
    setError
  } = useIntMaxClient()

  const [activeTab, setActiveTab] = useState("deposit")
  const [success, setSuccess] = useState<string | null>(null)
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState("")
  const [depositToken, setDepositToken] = useState("ETH")
  
  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawToken, setWithdrawToken] = useState("ETH")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  
  // Transfer state
  const [transferRecipients, setTransferRecipients] = useState<IntmaxRecipient[]>([
    { id: "1", address: "", amount: "", isValid: false }
  ])
  const [transferToken, setTransferToken] = useState("ETH")
  const [transferTotalAmount, setTransferTotalAmount] = useState("0")

  // Clear messages
  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  // Validate Ethereum address
  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // Validate INTMAX address
  const isValidIntmaxAddress = (address: string): boolean => {
    return address.startsWith('T') && address.length > 50
  }

  // Transfer recipient management
  const addTransferRecipient = () => {
    const newId = (transferRecipients.length + 1).toString()
    setTransferRecipients([...transferRecipients, { id: newId, address: "", amount: "", isValid: false }])
  }

  const removeTransferRecipient = (id: string) => {
    if (transferRecipients.length > 1) {
      setTransferRecipients(transferRecipients.filter(r => r.id !== id))
    }
  }

  const updateTransferRecipient = (id: string, field: 'address' | 'amount', value: string) => {
    setTransferRecipients(transferRecipients.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value }
        if (field === 'address') {
          updated.isValid = isValidIntmaxAddress(value)
        }
        return updated
      }
      return r
    }))
  }

  // Calculate transfer total amount
  useEffect(() => {
    const total = transferRecipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0
      return sum + amount
    }, 0)
    setTransferTotalAmount(total.toString())
  }, [transferRecipients])

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount')
      return
    }

    clearMessages()
    
    try {
      const result = await deposit(
        depositAmount,
        depositToken,
        depositToken === 'USDC' ? USDC_SEPOLIA_ADDRESS : undefined
      )
      
      if (result) {
        setSuccess(`Deposit successful! Transaction: ${result.txHash}`)
        setDepositAmount("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed')
    }
  }

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid withdrawal amount')
      return
    }

    if (!withdrawAddress || !isValidEthAddress(withdrawAddress)) {
      setError('Please enter a valid Ethereum address')
      return
    }

    clearMessages()
    
    try {
      const result = await withdraw(
        withdrawAmount,
        withdrawToken,
        withdrawAddress,
        withdrawToken === 'USDC' ? USDC_SEPOLIA_ADDRESS : undefined
      )
      
      if (result) {
        setSuccess(`Withdrawal successful! Transaction: ${result.txHash}`)
        setWithdrawAmount("")
        setWithdrawAddress("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    }
  }

  // Handle INTMAX transfer
  const handleTransfer = async () => {
    const validRecipients = transferRecipients.filter(r => r.isValid && r.amount && parseFloat(r.amount) > 0)
    
    if (validRecipients.length === 0) {
      setError('Please add at least one valid INTMAX recipient with amount')
      return
    }

    clearMessages()
    
    try {
      const result = await transfer({
        recipients: validRecipients.map(r => ({
          address: r.address,
          amount: r.amount
        })),
        token: transferToken,
        tokenAddress: transferToken === 'USDC' ? USDC_SEPOLIA_ADDRESS : undefined
      })
      
      if (result) {
        setSuccess(`INTMAX transfer successful! Transaction root: ${result.txTreeRoot}`)
        setTransferRecipients([{ id: "1", address: "", amount: "", isValid: false }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
    }
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
        {/* Main Desktop Window */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-lg">
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#0000FF] to-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚀</span>
                <span className="font-bold text-sm">Pay-Peer-Roll - INTMAX Client SDK</span>
              </div>
              <div className="flex space-x-1">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs hover:bg-[#E0E0E0] p-0"
                  title="Back to Dashboard"
                >
                  ←
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-black mb-2">INTMAX Client SDK Integration</h1>
                <p className="text-black">Frontend-based INTMAX integration with direct client-side SDK</p>
              </div>

              {/* Client Status */}
              <Card className="mb-6 bg-[#E0E0E0] border-2 border-inset">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-2">
                    🖥️ Client Status
                    <Badge variant={client ? "default" : "secondary"}>
                      {client ? "Initialized" : "Not Initialized"}
                    </Badge>
                    {isLoggedIn && (
                      <Badge variant="default">Connected</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!client ? (
                    <div className="space-y-4">
                      <p className="text-black">Initialize the INTMAX client to get started</p>
                      <Button 
                        onClick={initializeClient} 
                        disabled={loading}
                        className="bg-[#0000FF] text-white hover:bg-[#000080]"
                      >
                        {loading ? "Initializing..." : "Initialize INTMAX Client"}
                      </Button>
                    </div>
                  ) : !isLoggedIn ? (
                    <div className="space-y-4">
                      <p className="text-black">Connect your INTMAX account to continue</p>
                      <Button 
                        onClick={login} 
                        disabled={loading}
                        className="bg-[#0000FF] text-white hover:bg-[#000080]"
                      >
                        {loading ? "Connecting..." : "Connect INTMAX Account"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-black">Connected Address:</Label>
                        <Input 
                          value={clientAddress} 
                          readOnly 
                          className="font-mono text-sm bg-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={fetchBalances} 
                          disabled={loading}
                          size="sm"
                          className="bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          {loading ? "Refreshing..." : "Refresh Balances"}
                        </Button>
                        <Button 
                          onClick={logout} 
                          disabled={loading}
                          variant="outline"
                          size="sm"
                          className="bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Balances */}
              {isLoggedIn && (
                <Card className="mb-6 bg-[#E0E0E0] border-2 border-inset">
                  <CardHeader>
                    <CardTitle className="text-black">💰 Token Balances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {balances.length > 0 ? (
                        balances.map((balance, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="font-mono text-sm">{balance.token.symbol}</span>
                            <span className="font-bold">{balance.formattedBalance}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600">No balances available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Messages */}
              {error && (
                <Alert className="mb-6 bg-red-100 border-red-400">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-6 bg-green-100 border-green-400">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {/* Main Functionality */}
              {isLoggedIn && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-[#C0C0C0]">
                    <TabsTrigger value="deposit" className="text-black">💳 Deposit</TabsTrigger>
                    <TabsTrigger value="withdraw" className="text-black">💸 Withdraw</TabsTrigger>
                    <TabsTrigger value="transfer" className="text-black">🔄 Transfer</TabsTrigger>
                  </TabsList>

                  <TabsContent value="deposit" className="space-y-4">
                    <Card className="bg-[#E0E0E0] border-2 border-inset">
                      <CardHeader>
                        <CardTitle className="text-black">Deposit to INTMAX</CardTitle>
                        <CardDescription className="text-gray-600">
                          Deposit ETH or USDC from Sepolia to INTMAX for private transactions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-black">Token</Label>
                          <Select value={depositToken} onValueChange={setDepositToken}>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ETH">ETH (Native)</SelectItem>
                              <SelectItem value="USDC">USDC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-black">Amount</Label>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="0.0"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <Button 
                          onClick={handleDeposit} 
                          disabled={loading || !depositAmount}
                          className="w-full bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          {loading ? "Processing..." : `Deposit ${depositToken}`}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="withdraw" className="space-y-4">
                    <Card className="bg-[#E0E0E0] border-2 border-inset">
                      <CardHeader>
                        <CardTitle className="text-black">Withdraw from INTMAX</CardTitle>
                        <CardDescription className="text-gray-600">
                          Withdraw tokens from INTMAX back to Sepolia
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-black">Token</Label>
                          <Select value={withdrawToken} onValueChange={setWithdrawToken}>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ETH">ETH (Native)</SelectItem>
                              <SelectItem value="USDC">USDC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-black">Amount</Label>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="0.0"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-black">Recipient Address (Ethereum)</Label>
                          <Input
                            placeholder="0x..."
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                            className="bg-white font-mono"
                          />
                        </div>
                        <Button 
                          onClick={handleWithdraw} 
                          disabled={loading || !withdrawAmount || !withdrawAddress}
                          className="w-full bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          {loading ? "Processing..." : `Withdraw ${withdrawToken}`}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="transfer" className="space-y-4">
                    <Card className="bg-[#E0E0E0] border-2 border-inset">
                      <CardHeader>
                        <CardTitle className="text-black">INTMAX-to-INTMAX Transfer</CardTitle>
                        <CardDescription className="text-gray-600">
                          Transfer tokens between INTMAX addresses with privacy mixing
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-black">Token</Label>
                          <Select value={transferToken} onValueChange={setTransferToken}>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ETH">ETH (Native)</SelectItem>
                              <SelectItem value="USDC">USDC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-black">INTMAX Recipients</Label>
                            <Button 
                              onClick={addTransferRecipient}
                              size="sm"
                              className="bg-[#0000FF] text-white hover:bg-[#000080]"
                            >
                              + Add Recipient
                            </Button>
                          </div>
                          
                          {transferRecipients.map((recipient, index) => (
                            <div key={recipient.id} className="grid grid-cols-12 gap-2 mb-2">
                              <div className="col-span-8">
                                <Input
                                  placeholder="T..."
                                  value={recipient.address}
                                  onChange={(e) => updateTransferRecipient(recipient.id, 'address', e.target.value)}
                                  className={`bg-white font-mono text-xs ${recipient.address && !recipient.isValid ? 'border-red-500' : ''}`}
                                />
                                {recipient.address && !recipient.isValid && (
                                  <p className="text-red-500 text-xs mt-1">Invalid INTMAX address</p>
                                )}
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  step="0.000001"
                                  placeholder="0.0"
                                  value={recipient.amount}
                                  onChange={(e) => updateTransferRecipient(recipient.id, 'amount', e.target.value)}
                                  className="bg-white"
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  onClick={() => removeTransferRecipient(recipient.id)}
                                  disabled={transferRecipients.length === 1}
                                  size="sm"
                                  variant="outline"
                                  className="w-full bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between text-sm">
                            <span>Total Amount:</span>
                            <span className="font-bold">{transferTotalAmount} {transferToken}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Recipients:</span>
                            <span>{transferRecipients.filter(r => r.isValid && r.amount).length}</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleTransfer} 
                          disabled={loading || transferRecipients.filter(r => r.isValid && r.amount).length === 0}
                          className="w-full bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          {loading ? "Processing..." : `Transfer ${transferToken} to ${transferRecipients.filter(r => r.isValid && r.amount).length} Address(es)`}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>

            {/* Status Bar */}
            <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1">
              <div className="flex items-center justify-between text-xs text-black">
                <div className="flex items-center space-x-4">
                  <span>🚀 INTMAX Client SDK</span>
                  <span>🌐 Sepolia Testnet</span>
                  <span>{client ? (isLoggedIn ? '🟢 Connected' : '🟡 Initialized') : '🔴 Not Initialized'}</span>
                </div>
                <div>{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 