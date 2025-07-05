"use client"

import { useState } from "react"
import Link from "next/link"

export default function LaunchPage() {
  const [isLaunched, setIsLaunched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const mockEmployees = [
    { name: "John Doe", wallet: "0x1234...abcd", amount: "$1,275.00", status: "pending" },
    { name: "Jane Smith", wallet: "0x5678...efgh", amount: "$1,050.00", status: "pending" },
    { name: "Mike Johnson", wallet: "0x9abc...ijkl", amount: "$1,400.00", status: "pending" },
    { name: "Sarah Wilson", wallet: "0xdef0...mnop", amount: "$1,125.00", status: "pending" },
  ]

  const [employees, setEmployees] = useState(mockEmployees)

  const handleLaunch = async () => {
    setIsLoading(true)
    setProgress(0)

    // Simulate payment processing with progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    setEmployees((prev) => prev.map((emp) => ({ ...emp, status: "completed" })))
    setIsLaunched(true)
    setIsLoading(false)
  }

  const totalAmount = employees.reduce((sum, emp) => {
    return sum + Number.parseFloat(emp.amount.replace("$", "").replace(",", ""))
  }, 0)

  return (
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
              <span className="text-xl">🚀</span>
              <span className="font-bold text-sm">Payment Processor - Launch Distribution</span>
            </div>
            <div className="flex space-x-1">
              <Link href="/settings">
                <button className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs hover:bg-[#E0E0E0]">
                  ×
                </button>
              </Link>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="bg-[#C0C0C0] border-b border-[#808080] px-2 py-1">
            <div className="flex space-x-4 text-sm text-black">
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Process</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Monitor</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Reports</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Help</button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Panel */}
            <div className="bg-[#C0C0C0] border-2 border-inset p-4">
              <h2 className="font-bold text-black mb-4">💰 Payment Summary</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-inset p-3 text-center">
                  <div className="text-2xl font-bold text-black">{employees.length}</div>
                  <div className="text-sm text-black">👥 Employees</div>
                </div>
                <div className="bg-white border-2 border-inset p-3 text-center">
                  <div className="text-2xl font-bold text-black">${totalAmount.toLocaleString()}</div>
                  <div className="text-sm text-black">💵 Total Amount</div>
                </div>
                <div className="bg-white border-2 border-inset p-3 text-center">
                  <div className={`text-2xl font-bold ${isLaunched ? "text-green-600" : "text-blue-600"}`}>
                    {isLaunched ? "✅ COMPLETE" : "⏳ READY"}
                  </div>
                  <div className="text-sm text-black">🔄 Status</div>
                </div>
              </div>
            </div>

            {/* Progress Bar (when loading) */}
            {isLoading && (
              <div className="bg-[#C0C0C0] border-2 border-inset p-4">
                <h3 className="font-bold text-black mb-3">🔄 Processing Payments...</h3>
                <div className="bg-white border-2 border-inset p-2">
                  <div className="bg-[#C0C0C0] h-6 relative">
                    <div
                      className="bg-blue-600 h-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-black font-bold text-sm">
                      {progress}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employee List */}
            <div className="bg-[#C0C0C0] border-2 border-inset p-4">
              <h2 className="font-bold text-black mb-4">📋 Payment Recipients</h2>

              <div className="space-y-2">
                {employees.map((employee, index) => (
                  <div key={index} className="bg-white border-2 border-inset p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 border-2 border-inset ${
                          employee.status === "completed"
                            ? "bg-green-400"
                            : employee.status === "processing"
                              ? "bg-yellow-400"
                              : "bg-[#C0C0C0]"
                        }`}
                      ></div>
                      <div>
                        <div className="font-bold text-black">👤 {employee.name}</div>
                        <div className="text-sm text-[#404040]">💳 {employee.wallet}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-black">💰 {employee.amount}</div>
                      <div className="text-sm text-[#404040] capitalize">
                        {employee.status === "completed"
                          ? "✅ Sent"
                          : employee.status === "processing"
                            ? "⏳ Processing"
                            : "⏸️ Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            {!isLaunched && !isLoading && (
              <div className="text-center">
                <button
                  onClick={handleLaunch}
                  className="px-12 py-6 bg-[#C0C0C0] border-2 border-outset text-black font-bold text-xl hover:bg-[#E0E0E0] active:border-inset"
                >
                  🚀 LAUNCH PAYMENT DISTRIBUTION
                </button>
              </div>
            )}

            {/* Transaction Report */}
            {isLaunched && (
              <div className="bg-[#C0C0C0] border-2 border-inset p-4">
                <h2 className="font-bold text-black mb-4 flex items-center">📊 Transaction Report</h2>

                <div className="bg-black text-green-400 p-4 font-mono text-sm mb-4 border-2 border-inset">
                  <div className="text-yellow-400 mb-2">BLOCKCHAIN TRANSACTION LOG:</div>
                  <div>Transaction Hash: 0xabcd1234ef567890...</div>
                  <div>Block Number: 18,542,891</div>
                  <div>Gas Used: 245,678 gas (~$12.34)</div>
                  <div>Status: SUCCESS ✅</div>
                  <div className="text-green-400 mt-2">All payments distributed successfully!</div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm text-black">
                  <div className="bg-white border-2 border-inset p-3">
                    <div className="font-bold mb-2">📈 Transaction Details:</div>
                    <div>• Network: Ethereum Mainnet</div>
                    <div>• Confirmations: 12/12</div>
                    <div>• Processing Time: 2.3 seconds</div>
                  </div>
                  <div className="bg-white border-2 border-inset p-3">
                    <div className="font-bold mb-2">💸 Payment Summary:</div>
                    <div>• Recipients: {employees.length}</div>
                    <div>• Total Sent: ${totalAmount.toLocaleString()}</div>
                    <div>• Success Rate: 100%</div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link href="/dashboard">
                    <button className="px-8 py-4 bg-[#C0C0C0] border-2 border-outset text-black font-bold hover:bg-[#E0E0E0] active:border-inset">
                      🏠 Return to Dashboard
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1">
            <div className="flex items-center justify-between text-xs text-black">
              <div>
                {isLaunched
                  ? "✅ All payments completed successfully"
                  : isLoading
                    ? "🔄 Processing payments..."
                    : "💰 Ready to launch payment distribution"}
              </div>
              <div>Ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
