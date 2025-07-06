"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { checkStoredAuthentication } from "@/lib/wallet"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authInfo, setAuthInfo] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authStatus = checkStoredAuthentication()
        
        if (authStatus.isAuthenticated) {
          setIsAuthenticated(true)
          setAuthInfo(`Authenticated as ${authStatus.address?.slice(0, 6)}...${authStatus.address?.slice(-4)} (${authStatus.walletType})`)
        } else {
          setIsAuthenticated(false)
          setAuthInfo("No valid authentication found")
          router.push("/")
        }
      } catch (error) {
        console.error("Authentication check failed:", error)
        setIsAuthenticated(false)
        setAuthInfo("Authentication check failed")
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center">
        <div className="bg-[#C0C0C0] border-2 border-inset p-8 text-center">
          <div className="text-2xl mb-4 animate-pulse">🔍</div>
          <div className="text-black font-bold mb-2">Checking authentication...</div>
          <div className="text-xs text-gray-600">{authInfo}</div>
          <div className="mt-4 bg-white border-2 border-inset p-2">
            <div className="bg-blue-600 h-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center">
        <div className="bg-[#C0C0C0] border-2 border-inset p-8 text-center">
          <div className="text-2xl mb-4">⚠️</div>
          <div className="text-black font-bold mb-2">Authentication Required</div>
          <div className="text-xs text-gray-600 mb-4">{authInfo}</div>
          <div className="text-sm text-black">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
