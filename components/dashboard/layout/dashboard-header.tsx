"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Menu } from "lucide-react"
import { useDashboard } from "../context/dashboard-context"

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export const DashboardHeader = React.memo(({ onMenuClick }: DashboardHeaderProps) => {
  const { user } = useDashboard()

  if (!user) {
    return null
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {getGreeting()}, {user.first_name}!
          </h1>
          <p className="text-sm text-gray-600">
            {user.business_name ? `Welcome to ${user.business_name}` : "Welcome to your dashboard"}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">New screen connected</p>
                <p className="text-xs text-muted-foreground">Screen "Lobby Display" is now online</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Playlist updated</p>
                <p className="text-xs text-muted-foreground">Morning playlist has been modified</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Storage warning</p>
                <p className="text-xs text-muted-foreground">You're using 80% of your storage limit</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Plan Badge */}
        {user.plan_name && (
          <Badge variant="outline" className="text-xs">
            {user.plan_name}
          </Badge>
        )}
      </div>
    </header>
  )
})

DashboardHeader.displayName = "DashboardHeader"
