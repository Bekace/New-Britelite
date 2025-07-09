"use client"

import type React from "react"
import { useState } from "react"
import { DashboardProvider } from "../context/dashboard-context"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { DashboardFooter } from "./dashboard-footer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <DashboardProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6">{children}</main>
          <DashboardFooter />
        </div>
      </div>
    </DashboardProvider>
  )
}
