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
  is_email_verified: boolean
  plan_id?: string
  plan_name?: string
  max_screens?: number
  max_storage_gb?: number
  max_playlists?: number
  business_name?: string
  business_address?: string
  phone?: string
  avatar_url?: string
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
        const data = await response.json()
        setUser(data.user)
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

  return (
    <DashboardContext.Provider value={{ user, loading, logout, refreshUser }}>{children}</DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
