"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"

export default function PayrollPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
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
              <span className="text-xl">📊</span>
              <span className="font-bold text-sm">Payroll Manager - CSV Import</span>
            </div>
            <div className="flex space-x-1">
              <Link href="/dashboard">
                <button className="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs hover:bg-[#E0E0E0]">
                  ×
                </button>
              </Link>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="bg-[#C0C0C0] border-b border-[#808080] px-2 py-1">
            <div className="flex space-x-4 text-sm text-black">
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">File</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Import</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Validate</button>
              <button className="px-2 py-1 hover:bg-[#0000FF] hover:text-white">Help</button>
            </div>
          </div>

          <div className="p-6">
            {/* File Upload Section */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black mb-4">💾 Employee Data Import</h2>

              <div className="bg-[#C0C0C0] border-2 border-inset p-4 mb-4">
                <div
                  className={`
                    border-2 border-dashed p-8 text-center transition-all duration-200
                    ${dragActive ? "border-[#0000FF] bg-[#E0E0FF]" : "border-[#808080]"}
                    ${uploadedFile ? "bg-[#E0FFE0] border-green-600" : "bg-white"}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploadedFile ? (
                    <div className="text-black">
                      <div className="text-4xl mb-4">✅</div>
                      <p className="font-bold text-lg mb-2">File Loaded Successfully!</p>
                      <p className="text-sm mb-4">📄 {uploadedFile.name}</p>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="px-4 py-2 bg-[#C0C0C0] border-2 border-outset text-black hover:bg-[#E0E0E0] active:border-inset"
                      >
                        🔄 Load Different File
                      </button>
                    </div>
                  ) : (
                    <div className="text-black">
                      <div className="text-6xl mb-4">💾</div>
                      <p className="font-bold text-lg mb-2">Drop CSV File Here</p>
                      <p className="text-sm mb-4">or click Browse to select file</p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-block px-6 py-3 bg-[#C0C0C0] border-2 border-outset text-black font-bold cursor-pointer hover:bg-[#E0E0E0] active:border-inset"
                      >
                        📁 Browse Files
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Format Guide */}
            <div className="bg-[#C0C0C0] border-2 border-inset p-4 mb-6">
              <h3 className="font-bold text-black mb-3">📋 Required CSV Format</h3>
              <div className="bg-black text-green-400 p-3 font-mono text-sm mb-4 border-2 border-inset">
                <div>name,wallet_address,value_per_hour,worked_hours,non_payable_hours,extra_hours</div>
                <div className="text-yellow-400">John Doe,0x1234...abcd,25.50,40,0,5</div>
                <div className="text-yellow-400">Jane Smith,0x5678...efgh,30.00,35,2,0</div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm text-black">
                <div className="space-y-1">
                  <div>
                    <strong>👤 name:</strong> Employee full name
                  </div>
                  <div>
                    <strong>💳 wallet_address:</strong> Ethereum wallet
                  </div>
                  <div>
                    <strong>💰 value_per_hour:</strong> Hourly rate (USD)
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <strong>⏰ worked_hours:</strong> Total hours worked
                  </div>
                  <div>
                    <strong>❌ non_payable_hours:</strong> Unpaid hours
                  </div>
                  <div>
                    <strong>⭐ extra_hours:</strong> Overtime hours
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Link href="/dashboard">
                <button className="px-6 py-3 bg-[#C0C0C0] border-2 border-outset text-black font-bold hover:bg-[#E0E0E0] active:border-inset">
                  ← Back to Dashboard
                </button>
              </Link>

              {uploadedFile && (
                <Link href="/settings">
                  <button className="px-8 py-3 bg-[#C0C0C0] border-2 border-outset text-black font-bold hover:bg-[#E0E0E0] active:border-inset">
                    ⚙️ Configure Settings →
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-[#C0C0C0] border-t border-[#808080] px-2 py-1">
            <div className="flex items-center justify-between text-xs text-black">
              <div>{uploadedFile ? "📄 File loaded - Ready to proceed" : "💾 No file selected"}</div>
              <div>Ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
