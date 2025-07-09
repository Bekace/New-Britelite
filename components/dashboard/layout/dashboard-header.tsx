"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useDashboard } from "../context/dashboard-context"

interface DashboardHeaderProps {
  title?: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { user } = useDashboard()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          {title ? (
            <>
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </>
          ) : (
            <div>
              <h1 className="text-lg font-semibold">Welcome back, {user?.firstName}!</h1>
              <p className="text-sm text-muted-foreground">Manage your digital signage content and settings</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-64 pl-8" />
          </div>

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>
        </div>
      </div>
    </header>
  )
}
