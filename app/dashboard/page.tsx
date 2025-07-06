"use client"

import { useState } from "react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function Dashboard() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const applications = [
    {
      id: "payroll",
      title: "Payroll Manager",
      subtitle: "💾 Upload CSV Data",
      description: "Import employee hours and payment data",
      icon: "📊",
      href: "/payroll",
    },
    {
      id: "settings",
      title: "System Config",
      subtitle: "⚙️ Privacy & Bulk Settings",
      description: "Configure payment batching and rewards",
      icon: "🔧",
      href: "/settings",
    },
    {
      id: "launch",
      title: "Payment Processor",
      subtitle: "🚀 Execute Distribution",
      description: "Launch payments and view transaction logs",
      icon: "💸",
      href: "/launch",
    },
    {
      id: "intmax",
      title: "INTMAX Integration",
      subtitle: "⚡ Privacy Mixing",
      description: "Deposit, withdraw, and distribute with privacy",
      icon: "🔒",
      href: "/intmax",
    },
    {
      id: "intmax-client",
      title: "INTMAX Client SDK",
      subtitle: "🚀 Frontend Integration",
      description: "Direct client-side INTMAX integration",
      icon: "🖥️",
      href: "/intmax-client",
    },
    {
      id: "intmax-bridge",
      title: "INTMAX Bridge",
      subtitle: "🌉 EIP-712 Signing",
      description: "Bridge ETH to INTMAX with Ledger EIP-712 signatures",
      icon: "📝",
      href: "/intmax-bridge",
    },
    {
      id: "clear-signing",
      title: "Clear Signing Generator",
      subtitle: "📋 ERC-7730 JSON Builder",
      description: "Generate metadata files for Ledger Clear Signing",
      icon: "🔍",
      href: "/clear-signing",
    },
  ]

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
                <span className="text-xl">🧻</span>
                <span className="font-bold text-sm">Pay-Peer-Roll - Dashboard</span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    localStorage.removeItem("payroll_auth")
                    window.location.href = "/"
                  }}
                  className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs hover:bg-[#E0E0E0]"
                  title="Logout"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Menu Bar */}
            <div className="bg-[#C0C0C0] border-b border-[#808080] px-2 py-1">
              <div className="flex space-x-4 text-sm text-black">
                <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">File</button>
                <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Edit</button>
                <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">View</button>
                <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Tools</button>
                <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Help</button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-black mb-2">System Dashboard</h1>
                <p className="text-black">Select an application to continue:</p>
              </div>

              {/* Application Icons */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {applications.map((app) => (
                  <Link key={app.id} href={app.href}>
                    <div
                      className={`
                      bg-[#C0C0C0] border-2 border-outset p-6 text-center cursor-pointer
                      hover:bg-[#E0E0E0] active:border-inset transition-all duration-100
                      ${hoveredCard === app.id ? "bg-[#E0E0E0]" : ""}
                    `}
                      onMouseEnter={() => setHoveredCard(app.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="text-4xl mb-3">{app.icon}</div>
                      <h3 className="font-bold text-black mb-1">{app.title}</h3>
                      <p className="text-sm text-black mb-2">{app.subtitle}</p>
                      <p className="text-xs text-[#404040]">{app.description}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* System Information Panel */}
              <div className="bg-[#C0C0C0] border-2 border-inset p-4">
                <h3 className="font-bold text-black mb-3">💻 System Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-black">
                  <div>
                    <div className="flex justify-between">
                      <span>🧻 Application:</span>
                      <span>Pay-Peer-Roll v1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>💰 Status:</span>
                      <span className="text-green-600">Ready for Operations</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔒 Security:</span>
                      <span className="text-green-600">Encrypted</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>⛓️ Blockchain:</span>
                      <span className="text-green-600">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span>💳 Wallet:</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Records:</span>
                      <span>0 Loaded</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1">
              <div className="flex items-center justify-between text-xs text-black">
                <div className="flex items-center space-x-4">
                  <span>🟢 System Ready</span>
                  <span>💰 Payments: 0</span>
                  <span>🔒 Secure Mode</span>
                </div>
                <div>12:34 PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
