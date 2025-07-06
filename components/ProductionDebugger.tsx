"use client"

import { useState, useEffect } from "react"

export default function ProductionDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkEnvironment = () => {
      const info = {
        environment: typeof window !== 'undefined' ? 
          (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1') ? 'development' : 'production') : 'unknown',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        webHidAvailable: typeof navigator !== 'undefined' && !!navigator.hid,
        localStorageAvailable: typeof localStorage !== 'undefined',
        authData: null as any,
        issues: [] as string[]
      }

      // Check for common production issues
      if (info.environment === 'production') {
        if (info.protocol !== 'https:') {
          info.issues.push('Not using HTTPS - Web HID requires secure context')
        }
        if (!info.webHidAvailable) {
          info.issues.push('Web HID API not available - may not work in this browser')
        }
        if (!info.localStorageAvailable) {
          info.issues.push('localStorage not available - may be in private mode')
        }
      }

      // Check current auth state
      try {
        const authData = localStorage.getItem("payroll_auth")
        if (authData) {
          info.authData = JSON.parse(authData)
        }
      } catch (error) {
        info.issues.push('Error reading auth data from localStorage')
      }

      setDebugInfo(info)
    }

    checkEnvironment()
    const interval = setInterval(checkEnvironment, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-500 text-white p-2 rounded-full text-xs z-50"
        title="Show Production Debugger"
      >
        🌐
      </button>
    )
  }

  if (!debugInfo) {
    return <div>Loading...</div>
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">🌐 Production Debugger</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Environment:</strong> {debugInfo.environment}
        </div>
        <div>
          <strong>Hostname:</strong> {debugInfo.hostname}
        </div>
        <div>
          <strong>Protocol:</strong> {debugInfo.protocol}
        </div>
        <div>
          <strong>Web HID:</strong> 
          <span className={debugInfo.webHidAvailable ? "text-green-400" : "text-red-400"}>
            {debugInfo.webHidAvailable ? " Available" : " Not Available"}
          </span>
        </div>
        <div>
          <strong>localStorage:</strong> 
          <span className={debugInfo.localStorageAvailable ? "text-green-400" : "text-red-400"}>
            {debugInfo.localStorageAvailable ? " Available" : " Not Available"}
          </span>
        </div>
        
        {debugInfo.authData && (
          <div>
            <strong>Auth:</strong> {debugInfo.authData.walletType} - {debugInfo.authData.address ? `${debugInfo.authData.address.slice(0, 6)}...` : 'No address'}
          </div>
        )}
        
        {debugInfo.issues.length > 0 && (
          <div className="mt-2">
            <strong className="text-red-400">Issues:</strong>
            <ul className="list-disc list-inside text-red-300">
              {debugInfo.issues.map((issue: string, index: number) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        
        <button
          onClick={() => {
            localStorage.removeItem("payroll_auth")
            setDebugInfo((prev: any) => ({ ...prev, authData: null }))
          }}
          className="w-full mt-2 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear Auth
        </button>
      </div>
    </div>
  )
} 