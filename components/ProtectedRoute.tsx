"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem("payroll_auth")

      if (!authData) {
        setIsAuthenticated(false)
        router.push("/")
        return
      }

      try {
        const { timestamp } = JSON.parse(authData)
        // Check if auth is less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem("payroll_auth")
          setIsAuthenticated(false)
          router.push("/")
        }
      } catch (error) {
        localStorage.removeItem("payroll_auth")
        setIsAuthenticated(false)
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center">
        <div className="bg-[#C0C0C0] border-2 border-inset p-8 text-center">
          <div className="text-2xl mb-4">🔄</div>
          <div className="text-black font-bold">Checking authentication...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
