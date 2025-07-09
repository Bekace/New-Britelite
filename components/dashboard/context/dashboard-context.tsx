"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "user" | "admin" | "super_admin"
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface DashboardContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else if (response.status === 401) {
        setUser(null)
      } else {
        throw new Error("Failed to fetch user data")
      }
    } catch (err) {
      console.error("Error fetching user:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      window.location.href = "/auth/login"
    } catch (err) {
      console.error("Error logging out:", err)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const value: DashboardContextType = {
    user,
    loading,
    error,
    refreshUser,
    logout,
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
