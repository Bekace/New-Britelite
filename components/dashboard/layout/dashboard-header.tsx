"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Menu } from "lucide-react"
import { useDashboard } from "../context/dashboard-context"

interface DashboardHeaderProps {
  title?: string
  description?: string
  onMenuClick?: () => void
}

export const DashboardHeader = React.memo(({ title, description, onMenuClick }: DashboardHeaderProps) => {
  const { user } = useDashboard()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            {title ? (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && <p className="text-gray-600">{description}</p>}
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getGreeting()}, {user?.first_name}!
                </h1>
                <p className="text-gray-600">Welcome back to your digital signage dashboard</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">System Update</p>
                    <p className="text-xs text-blue-700">New features available in Media Library</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">Storage Warning</p>
                    <p className="text-xs text-yellow-700">You're using 80% of your storage quota</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Display Online</p>
                    <p className="text-xs text-green-700">Main lobby display is now connected</p>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plan Badge */}
          <Badge variant="outline" className="hidden sm:inline-flex">
            {user?.plan_name || "Free Plan"}
          </Badge>
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = "DashboardHeader"
