"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "admin" | "super_admin"
  business_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface DashboardContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        setUser(null)
        if (response.status === 401) {
          router.push("/auth/login")
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const value = {
    user,
    loading,
    logout,
    refreshUser,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
