"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, User, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboard } from "../context/dashboard-context"
import { mainNavigationItems, accountNavigationItems, adminNavigationItems } from "../config/navigation"

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const DashboardSidebar = React.memo(function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const { user, logout } = useDashboard()
  const pathname = usePathname()

  if (!user) return null

  const isAdmin = user.role === "admin" || user.role === "super_admin"
  const isSuperAdmin = user.role === "super_admin"

  const renderNavigationSection = (items: any[], title: string, isAdminSection = false) => (
    <div className="space-y-1">
      {!collapsed && (
        <div className={cn("px-3 py-2 mb-2", isAdminSection && "bg-orange-50 rounded-lg border border-orange-200")}>
          <h3
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              isAdminSection ? "text-orange-700" : "text-muted-foreground",
            )}
          >
            {title}
          </h3>
          {isAdminSection && <p className="text-xs text-orange-600 mt-1">Admin Tools & Management</p>}
        </div>
      )}
      {items.map((item) => {
        // Filter admin-only items
        if (item.adminOnly && !isAdmin) return null
        if (item.superAdminOnly && !isSuperAdmin) return null

        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isAdminSection
                  ? "hover:bg-orange-100 hover:text-orange-900"
                  : "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? isAdminSection
                    ? "bg-orange-100 text-orange-900 border border-orange-200"
                    : "bg-accent text-accent-foreground"
                  : isAdminSection
                    ? "text-orange-700"
                    : "text-muted-foreground",
                collapsed && "justify-center",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {item.superAdminOnly && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      Super Admin
                    </Badge>
                  )}
                </>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">BL</span>
            </div>
            <span className="font-semibold">BriteLite</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {/* Main Navigation */}
        {renderNavigationSection(mainNavigationItems, "Main")}

        {/* Account Section */}
        <Separator />
        {renderNavigationSection(accountNavigationItems, "Account")}

        {/* Admin Section - Visually Separated */}
        {isAdmin && (
          <>
            <Separator className="bg-orange-200" />
            {renderNavigationSection(adminNavigationItems, "Administration", true)}
          </>
        )}
      </div>

      {/* User Menu */}
      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn("w-full justify-start space-x-3", collapsed && "justify-center px-2")}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})
