"use client"

import { useState } from "react"
import Link from "next/link"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    bulkSends: false,
    randomRewards: false,
    rewardAmount: "",
    rewardReceivers: "",
    gasOptimization: true,
    notifications: true,
  })

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-lg">
          {/* Title Bar */}
          <div className="bg-gradient-to-r from-[#0000FF] to-[#000080] text-white px-2 py-1 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚙️</span>
              <span className="font-bold text-sm">System Configuration</span>
            </div>
            <div className="flex space-x-1">
              <Link href="/payroll">
                <button className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs hover:bg-[#E0E0E0]">
                  ×
                </button>
              </Link>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="bg-[#C0C0C0] border-b border-[#808080] px-2 py-1">
            <div className="flex space-x-4 text-sm text-black">
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Options</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Privacy</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Advanced</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Help</button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Privacy Settings */}
            <div className="bg-[#C0C0C0] border-2 border-inset p-4">
              <h2 className="font-bold text-black mb-4 flex items-center">🔒 Privacy & Security Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-white border-2 border-inset">
                  <div>
                    <div className="font-bold text-black">💸 Bulk Payment Processing</div>
                    <div className="text-sm text-[#404040]">Send multiple payments in batches for enhanced privacy</div>
                  </div>
                  <button
                    onClick={() => handleToggle("bulkSends")}
                    className={`
                      w-16 h-8 border-2 border-inset flex items-center
                      ${settings.bulkSends ? "bg-green-400 justify-end" : "bg-[#C0C0C0] justify-start"}
                    `}
                  >
                    <div className="w-6 h-6 bg-white border border-[#808080] shadow-sm"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 bg-white border-2 border-inset">
                  <div>
                    <div className="font-bold text-black">⚡ Gas Fee Optimization</div>
                    <div className="text-sm text-[#404040]">Optimize transaction timing for lower network fees</div>
                  </div>
                  <button
                    onClick={() => handleToggle("gasOptimization")}
                    className={`
                      w-16 h-8 border-2 border-inset flex items-center
                      ${settings.gasOptimization ? "bg-green-400 justify-end" : "bg-[#C0C0C0] justify-start"}
                    `}
                  >
                    <div className="w-6 h-6 bg-white border border-[#808080] shadow-sm"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Random Rewards */}
            <div className="bg-[#C0C0C0] border-2 border-inset p-4">
              <h2 className="font-bold text-black mb-4 flex items-center">🎁 Random Bonus System</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-white border-2 border-inset">
                  <div>
                    <div className="font-bold text-black">🎲 Enable Random Rewards</div>
                    <div className="text-sm text-[#404040]">Distribute surprise bonuses to random employees</div>
                  </div>
                  <button
                    onClick={() => handleToggle("randomRewards")}
                    className={`
                      w-16 h-8 border-2 border-inset flex items-center
                      ${settings.randomRewards ? "bg-green-400 justify-end" : "bg-[#C0C0C0] justify-start"}
                    `}
                  >
                    <div className="w-6 h-6 bg-white border border-[#808080] shadow-sm"></div>
                  </button>
                </div>

                {settings.randomRewards && (
                  <div className="bg-white border-2 border-inset p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-black mb-2">💰 Bonus Amount (USD):</label>
                        <input
                          type="number"
                          value={settings.rewardAmount}
                          onChange={(e) => handleInputChange("rewardAmount", e.target.value)}
                          className="w-full p-2 border-2 border-inset bg-white text-black"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-black mb-2">👥 Number of Recipients:</label>
                        <input
                          type="number"
                          value={settings.rewardReceivers}
                          onChange={(e) => handleInputChange("rewardReceivers", e.target.value)}
                          className="w-full p-2 border-2 border-inset bg-white text-black"
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[#C0C0C0] border-2 border-inset p-4">
              <h2 className="font-bold text-black mb-4 flex items-center">🔔 System Notifications</h2>

              <div className="flex items-center justify-between p-2 bg-white border-2 border-inset">
                <div>
                  <div className="font-bold text-black">📧 Transaction Alerts</div>
                  <div className="text-sm text-[#404040]">Receive notifications when payments are processed</div>
                </div>
                <button
                  onClick={() => handleToggle("notifications")}
                  className={`
                    w-16 h-8 border-2 border-inset flex items-center
                    ${settings.notifications ? "bg-green-400 justify-end" : "bg-[#C0C0C0] justify-start"}
                  `}
                >
                  <div className="w-6 h-6 bg-white border border-[#808080] shadow-sm"></div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Link href="/payroll">
                <button className="px-6 py-3 bg-[#C0C0C0] border-2 border-outset text-black font-bold hover:bg-[#E0E0E0] active:border-inset">
                  ← Back to Payroll
                </button>
              </Link>
              <Link href="/launch">
                <button className="px-8 py-3 bg-[#C0C0C0] border-2 border-outset text-black font-bold hover:bg-[#E0E0E0] active:border-inset">
                  🚀 Launch Payments →
                </button>
              </Link>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1">
            <div className="flex items-center justify-between text-xs text-black">
              <div>⚙️ Configuration saved automatically</div>
              <div>Ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
