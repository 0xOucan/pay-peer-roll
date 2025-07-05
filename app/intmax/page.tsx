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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// USDC contract address on Sepolia
const USDC_SEPOLIA_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

interface TokenBalance {
  token: string
  balance: string
  symbol: string
  decimals: number
}

interface RecipientAddress {
  id: string
  address: string
  amount: string
  isValid: boolean
}

export default function IntmaxPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("deposit")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Balance state
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [clientAddress, setClientAddress] = useState<string>("")
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState("")
  const [depositToken, setDepositToken] = useState("ETH")
  
  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawToken, setWithdrawToken] = useState("ETH")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  
  // Multi-send state
  const [recipients, setRecipients] = useState<RecipientAddress[]>([
    { id: "1", address: "", amount: "", isValid: false }
  ])
  const [multiSendToken, setMultiSendToken] = useState("ETH")
  const [totalAmount, setTotalAmount] = useState("0")

  // Clear messages
  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  // Validate Ethereum address
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // Add recipient
  const addRecipient = () => {
    const newId = (recipients.length + 1).toString()
    setRecipients([...recipients, { id: newId, address: "", amount: "", isValid: false }])
  }

  // Remove recipient
  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter(r => r.id !== id))
    }
  }

  // Update recipient
  const updateRecipient = (id: string, field: 'address' | 'amount', value: string) => {
    setRecipients(recipients.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value }
        if (field === 'address') {
          updated.isValid = isValidAddress(value)
        }
        return updated
      }
      return r
    }))
  }

  // Calculate total amount
  useEffect(() => {
    const total = recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0
      return sum + amount
    }, 0)
    setTotalAmount(total.toString())
  }, [recipients])

  // INTMAX Client operations
  const loginToIntmax = async () => {
    setIsLoading(true)
    clearMessages()
    
    try {
      const response = await fetch('/api/intmax/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      setIsLoggedIn(true)
      setClientAddress(data.address)
      setBalances(data.balances)
      setSuccess('Successfully logged in to INTMAX!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logoutFromIntmax = async () => {
    setIsLoading(true)
    clearMessages()
    
    try {
      const response = await fetch('/api/intmax/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        throw new Error('Logout failed')
      }
      
      setIsLoggedIn(false)
      setClientAddress("")
      setBalances([])
      setSuccess('Successfully logged out from INTMAX!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount')
      return
    }

    setIsLoading(true)
    clearMessages()
    
    try {
      const response = await fetch('/api/intmax/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          token: depositToken,
          tokenAddress: depositToken === 'USDC' ? USDC_SEPOLIA_ADDRESS : null
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Deposit failed')
      }
      
      setSuccess(`Deposit successful! Transaction: ${data.txHash}`)
      setDepositAmount("")
      
      // Refresh balances
      await refreshBalances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid withdrawal amount')
      return
    }
    
    if (!isValidAddress(withdrawAddress)) {
      setError('Please enter a valid Ethereum address')
      return
    }

    setIsLoading(true)
    clearMessages()
    
    try {
      const response = await fetch('/api/intmax/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          token: withdrawToken,
          toAddress: withdrawAddress,
          tokenAddress: withdrawToken === 'USDC' ? USDC_SEPOLIA_ADDRESS : null
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal failed')
      }
      
      setSuccess(`Withdrawal successful! Transaction: ${data.txHash}`)
      setWithdrawAmount("")
      setWithdrawAddress("")
      
      // Refresh balances
      await refreshBalances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMultiSend = async () => {
    const validRecipients = recipients.filter(r => r.isValid && r.amount && parseFloat(r.amount) > 0)
    
    if (validRecipients.length === 0) {
      setError('Please add at least one valid recipient with amount')
      return
    }

    setIsLoading(true)
    clearMessages()
    
    try {
      const response = await fetch('/api/intmax/multi-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validRecipients.map(r => ({
            address: r.address,
            amount: r.amount
          })),
          token: multiSendToken,
          tokenAddress: multiSendToken === 'USDC' ? USDC_SEPOLIA_ADDRESS : null
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Multi-send failed')
      }
      
      setSuccess(`Multi-send successful! ${data.transactions.length} transactions completed`)
      setRecipients([{ id: "1", address: "", amount: "", isValid: false }])
      
      // Refresh balances
      await refreshBalances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Multi-send failed')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshBalances = async () => {
    try {
      const response = await fetch('/api/intmax/balances')
      const data = await response.json()
      
      if (response.ok) {
        setBalances(data.balances)
      }
    } catch (err) {
      console.error('Failed to refresh balances:', err)
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
                <span className="text-xl">⚡</span>
                <span className="font-bold text-sm">Pay-Peer-Roll - INTMAX Integration</span>
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
                <h1 className="text-2xl font-bold text-black mb-2">INTMAX Network Integration</h1>
                <p className="text-black">Deposit, withdraw, and distribute tokens with privacy mixing on Sepolia testnet</p>
              </div>

              {/* Connection Status */}
              <Card className="mb-6 bg-[#E0E0E0] border-2 border-inset">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-2">
                    🔌 INTMAX Connection
                    <Badge variant={isLoggedIn ? "default" : "secondary"}>
                      {isLoggedIn ? "Connected" : "Disconnected"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isLoggedIn ? (
                    <Button 
                      onClick={loginToIntmax} 
                      disabled={isLoading}
                      className="bg-[#0000FF] text-white hover:bg-[#000080]"
                    >
                      {isLoading ? "Connecting..." : "Connect to INTMAX"}
                    </Button>
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
                      <Button 
                        onClick={logoutFromIntmax} 
                        disabled={isLoading}
                        variant="outline"
                        className="bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Balances */}
              {isLoggedIn && (
                <Card className="mb-6 bg-[#E0E0E0] border-2 border-inset">
                  <CardHeader>
                    <CardTitle className="text-black">💰 INTMAX Balances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {balances.length > 0 ? (
                        balances.map((balance, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="font-mono text-sm">{balance.symbol}</span>
                            <span className="font-bold">{balance.balance}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600">No balances available</p>
                      )}
                    </div>
                    <Button 
                      onClick={refreshBalances} 
                      size="sm" 
                      className="mt-4 bg-[#0000FF] text-white hover:bg-[#000080]"
                    >
                      Refresh Balances
                    </Button>
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
                    <TabsTrigger value="multi-send" className="text-black">🚀 Multi-Send</TabsTrigger>
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
                          disabled={isLoading || !depositAmount}
                          className="w-full bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          {isLoading ? "Processing..." : `Deposit ${depositToken}`}
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
                          <Label className="text-black">Recipient Address</Label>
                          <Input
                            placeholder="0x..."
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                            className="bg-white font-mono"
                          />
                        </div>
                        <Button 
                          onClick={handleWithdraw} 
                          disabled={isLoading || !withdrawAmount || !withdrawAddress}
                          className="w-full bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          {isLoading ? "Processing..." : `Withdraw ${withdrawToken}`}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="multi-send" className="space-y-4">
                    <Card className="bg-[#E0E0E0] border-2 border-inset">
                      <CardHeader>
                        <CardTitle className="text-black">Multi-Address Distribution</CardTitle>
                        <CardDescription className="text-gray-600">
                          Send tokens to multiple addresses with privacy mixing
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-black">Token</Label>
                          <Select value={multiSendToken} onValueChange={setMultiSendToken}>
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
                            <Label className="text-black">Recipients</Label>
                            <Button 
                              onClick={addRecipient}
                              size="sm"
                              className="bg-[#0000FF] text-white hover:bg-[#000080]"
                            >
                              + Add Recipient
                            </Button>
                          </div>
                          
                          {recipients.map((recipient, index) => (
                            <div key={recipient.id} className="grid grid-cols-12 gap-2 mb-2">
                              <div className="col-span-8">
                                <Input
                                  placeholder="0x..."
                                  value={recipient.address}
                                  onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                                  className={`bg-white font-mono ${recipient.address && !recipient.isValid ? 'border-red-500' : ''}`}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  step="0.000001"
                                  placeholder="0.0"
                                  value={recipient.amount}
                                  onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                                  className="bg-white"
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  onClick={() => removeRecipient(recipient.id)}
                                  disabled={recipients.length === 1}
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
                            <span className="font-bold">{totalAmount} {multiSendToken}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Recipients:</span>
                            <span>{recipients.filter(r => r.isValid && r.amount).length}</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleMultiSend} 
                          disabled={isLoading || recipients.filter(r => r.isValid && r.amount).length === 0}
                          className="w-full bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          {isLoading ? "Processing..." : `Send ${multiSendToken} to ${recipients.filter(r => r.isValid && r.amount).length} Recipients`}
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
                  <span>⚡ INTMAX Integration</span>
                  <span>🌐 Sepolia Testnet</span>
                  <span>{isLoggedIn ? '🟢 Connected' : '🔴 Disconnected'}</span>
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