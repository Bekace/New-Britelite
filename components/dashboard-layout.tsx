"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { LayoutDashboard, Image, Monitor, PlaySquare, Settings, Users, CreditCard } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: "user" | "admin"
    avatar_url?: string
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Media Library", href: "/dashboard/media", icon: Image },
  { name: "Screens", href: "/dashboard/screens", icon: Monitor },
  { name: "Playlists", href: "/dashboard/playlists", icon: PlaySquare },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const adminNavigation = [
  { name: "Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Plans", href: "/dashboard/admin/plans", icon: CreditCard },
]

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DS</span>
          </div>
          <span className="font-bold text-lg">Digital Signage</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          
          {user?.role === "admin" && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </h3>
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>
      </ScrollArea>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left\
