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
import { useIntmaxBridge } from "@/hooks/useIntmaxBridge"

export default function IntmaxBridgePage() {
  const router = useRouter()
  const {
    // State
    isConnected,
    ledgerAddress,
    currentTransaction,
    transactionHistory,
    loading,
    error,
    status,
    bridgeContract,
    
    // Actions
    connectLedger,
    disconnectLedger,
    createBridgeTransaction,
    createMockTransaction,
    signWithLedger,
    submitTransaction,
    clearTransaction,
    clearMessages,
    getTransactionDisplay
  } = useIntmaxBridge()

  const [activeTab, setActiveTab] = useState("bridge")
  
  // Bridge form state
  const [bridgeForm, setBridgeForm] = useState({
    amount: "",
    recipientSaltHash: "",
    amlPermission: "",
    eligibilityPermission: "",
    nonce: "1"
  })

  // Clear messages when tab changes
  useEffect(() => {
    clearMessages()
  }, [activeTab, clearMessages])

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setBridgeForm(prev => ({ ...prev, [field]: value }))
  }

  // Create bridge transaction
  const handleCreateTransaction = () => {
    if (!bridgeForm.amount || parseFloat(bridgeForm.amount) <= 0) {
      return
    }

    const amountWei = (parseFloat(bridgeForm.amount) * 1e18).toString()
    
    createBridgeTransaction(
      bridgeForm.recipientSaltHash || '0x5fa0d446d07aefdec7ff6a02fd2e513a076198a2d334cd37722dced0bc52c7f9',
      amountWei,
      bridgeForm.amlPermission || undefined,
      bridgeForm.eligibilityPermission || undefined,
      bridgeForm.nonce || undefined
    )
  }

  // Get transaction display data
  const transactionDisplay = getTransactionDisplay()

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
                <span className="text-xl">📝</span>
                <span className="font-bold text-sm">Pay-Peer-Roll - INTMAX Bridge (EIP-712)</span>
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
                <h1 className="text-2xl font-bold text-black mb-2">INTMAX Bridge - EIP-712 Signing</h1>
                <p className="text-black">Bridge ETH from Sepolia to INTMAX using Ledger EIP-712 typed data signatures</p>
              </div>

              {/* Ledger Connection Status */}
              <Card className="mb-6 bg-[#E0E0E0] border-2 border-inset">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-2">
                    🔐 Ledger Device Status
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Connected" : "Not Connected"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isConnected ? (
                    <div className="space-y-4">
                      <p className="text-black">Connect your Ledger device to sign EIP-712 typed data</p>
                      <Button 
                        onClick={connectLedger} 
                        disabled={loading}
                        className="bg-[#0000FF] text-white hover:bg-[#000080]"
                      >
                        {loading ? "Connecting..." : "Connect Ledger Device"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-black">Connected Address:</Label>
                        <Input 
                          value={ledgerAddress || ""} 
                          readOnly 
                          className="font-mono text-sm bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-black">Bridge Contract:</Label>
                        <Input 
                          value={bridgeContract} 
                          readOnly 
                          className="font-mono text-sm bg-white"
                        />
                      </div>
                      <Button 
                        onClick={disconnectLedger} 
                        variant="outline"
                        size="sm"
                        className="bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              {error && (
                <Alert className="mb-6 bg-red-100 border-red-400">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              {status && (
                <Alert className="mb-6 bg-blue-100 border-blue-400">
                  <AlertDescription className="text-blue-700">{status}</AlertDescription>
                </Alert>
              )}

              {/* Main Functionality */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-[#C0C0C0]">
                  <TabsTrigger value="bridge" className="text-black">🌉 Bridge</TabsTrigger>
                  <TabsTrigger value="sign" className="text-black">📝 Sign</TabsTrigger>
                  <TabsTrigger value="history" className="text-black">📋 History</TabsTrigger>
                </TabsList>

                <TabsContent value="bridge" className="space-y-4">
                  <Card className="bg-[#E0E0E0] border-2 border-inset">
                    <CardHeader>
                      <CardTitle className="text-black">Create Bridge Transaction</CardTitle>
                      <CardDescription className="text-gray-600">
                        Prepare EIP-712 typed data for bridging ETH to INTMAX
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-black">Amount (ETH)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.1"
                            value={bridgeForm.amount}
                            onChange={(e) => handleFormChange('amount', e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-black">Nonce</Label>
                          <Input
                            type="number"
                            placeholder="1"
                            value={bridgeForm.nonce}
                            onChange={(e) => handleFormChange('nonce', e.target.value)}
                            className="bg-white"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-black">Recipient Salt Hash</Label>
                        <Input
                          placeholder="0x5fa0d446d07aefdec7ff6a02fd2e513a076198a2d334cd37722dced0bc52c7f9"
                          value={bridgeForm.recipientSaltHash}
                          onChange={(e) => handleFormChange('recipientSaltHash', e.target.value)}
                          className="bg-white font-mono text-xs"
                        />
                        <p className="text-xs text-gray-600 mt-1">Leave empty to use default test value</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-black">AML Permission (optional)</Label>
                          <Input
                            placeholder="0x..."
                            value={bridgeForm.amlPermission}
                            onChange={(e) => handleFormChange('amlPermission', e.target.value)}
                            className="bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-black">Eligibility Permission (optional)</Label>
                          <Input
                            placeholder="0x..."
                            value={bridgeForm.eligibilityPermission}
                            onChange={(e) => handleFormChange('eligibilityPermission', e.target.value)}
                            className="bg-white font-mono text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCreateTransaction} 
                          disabled={loading || !bridgeForm.amount}
                          className="bg-[#0000FF] text-white hover:bg-[#000080]"
                        >
                          Create Transaction
                        </Button>
                        <Button 
                          onClick={createMockTransaction} 
                          disabled={loading}
                          variant="outline"
                          className="bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                        >
                          Create Mock Transaction
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sign" className="space-y-4">
                  <Card className="bg-[#E0E0E0] border-2 border-inset">
                    <CardHeader>
                      <CardTitle className="text-black">EIP-712 Typed Data Signing</CardTitle>
                      <CardDescription className="text-gray-600">
                        Review and sign the transaction with your Ledger device
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!currentTransaction ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600">No transaction to sign. Create one in the Bridge tab.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Transaction Status */}
                          <div className="flex items-center gap-2">
                            <Label className="text-black">Status:</Label>
                            <Badge variant={
                              currentTransaction.status === 'signed' ? 'default' :
                              currentTransaction.status === 'failed' ? 'destructive' :
                              'secondary'
                            }>
                              {currentTransaction.status.toUpperCase()}
                            </Badge>
                          </div>

                          {/* Transaction Display */}
                          {transactionDisplay && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-bold text-black mb-2">Domain Information</h4>
                                <div className="bg-white p-3 rounded border space-y-1">
                                  {Object.entries(transactionDisplay.domain).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="font-medium">{key}:</span>
                                      <span className="font-mono">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-black mb-2">Message Data</h4>
                                <div className="bg-white p-3 rounded border space-y-1">
                                  {Object.entries(transactionDisplay.message).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="font-medium">{key}:</span>
                                      <span className="font-mono">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Signature Display */}
                          {currentTransaction.signature && (
                            <div>
                              <h4 className="font-bold text-black mb-2">Signature</h4>
                              <div className="bg-white p-3 rounded border space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">r:</span>
                                  <span className="font-mono text-xs">{currentTransaction.signature.r}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">s:</span>
                                  <span className="font-mono text-xs">{currentTransaction.signature.s}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">v:</span>
                                  <span className="font-mono">{currentTransaction.signature.v}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {currentTransaction.status === 'pending' && (
                              <Button 
                                onClick={() => signWithLedger()} 
                                disabled={loading || !isConnected}
                                className="bg-[#0000FF] text-white hover:bg-[#000080]"
                              >
                                {loading ? "Signing..." : "Sign with Ledger"}
                              </Button>
                            )}
                            
                            {currentTransaction.status === 'signed' && (
                              <Button 
                                onClick={() => submitTransaction()} 
                                disabled={loading}
                                className="bg-[#008000] text-white hover:bg-[#006000]"
                              >
                                {loading ? "Submitting..." : "Submit Transaction"}
                              </Button>
                            )}
                            
                            <Button 
                              onClick={clearTransaction} 
                              variant="outline"
                              className="bg-[#C0C0C0] text-black hover:bg-[#E0E0E0]"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card className="bg-[#E0E0E0] border-2 border-inset">
                    <CardHeader>
                      <CardTitle className="text-black">Transaction History</CardTitle>
                      <CardDescription className="text-gray-600">
                        View all bridge transactions and their status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {transactionHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600">No transactions yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {transactionHistory.map((tx) => (
                            <div key={tx.id} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">{tx.id}</span>
                                    <Badge variant={
                                      tx.status === 'signed' || tx.status === 'submitted' ? 'default' :
                                      tx.status === 'failed' ? 'destructive' :
                                      'secondary'
                                    }>
                                      {tx.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Amount: {(parseFloat(tx.typedData.message.amount) / 1e18).toFixed(6)} ETH
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(tx.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                {tx.txHash && (
                                  <div className="text-right">
                                    <p className="text-xs text-gray-600">Tx Hash:</p>
                                    <p className="font-mono text-xs">{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Status Bar */}
            <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1">
              <div className="flex items-center justify-between text-xs text-black">
                <div className="flex items-center space-x-4">
                  <span>📝 EIP-712 Bridge</span>
                  <span>🌐 Sepolia → INTMAX</span>
                  <span>{isConnected ? '🟢 Ledger Connected' : '🔴 Ledger Disconnected'}</span>
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