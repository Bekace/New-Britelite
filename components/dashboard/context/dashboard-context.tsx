"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "admin" | "super_admin"
  is_email_verified: boolean
  business_name?: string
  avatar_url?: string
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
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        setUser(null)
        if (response.status !== 401) {
          setError("Failed to fetch user data")
        }
      }
    } catch (err) {
      console.error("Error fetching user:", err)
      setError("Network error")
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
      console.error("Logout error:", err)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        user,
        loading,
        error,
        refreshUser,
        logout,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
