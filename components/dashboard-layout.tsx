"use client"

import type React from "react"
import { DashboardProvider } from "./dashboard/context/dashboard-context"
import { DashboardSidebar } from "./dashboard/layout/dashboard-sidebar"
import { DashboardHeader } from "./dashboard/layout/dashboard-header"
import { DashboardFooter } from "./dashboard/layout/dashboard-footer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
          <DashboardFooter />
        </div>
      </div>
    </DashboardProvider>
  )
}

export default DashboardLayout
