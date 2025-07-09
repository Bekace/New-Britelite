"use client"

import type React from "react"
import { useState } from "react"
import { DashboardProvider } from "../context/dashboard-context"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { DashboardFooter } from "./dashboard-footer"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <DashboardProvider>
      <div className="flex h-screen bg-background">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader title={title} description={description} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
          <DashboardFooter />
        </div>
      </div>
    </DashboardProvider>
  )
}
