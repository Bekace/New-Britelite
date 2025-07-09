"use client"

import React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardProvider, useDashboard } from "../context/dashboard-context"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { DashboardFooter } from "./dashboard-footer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayoutContent = React.memo(({ children }: DashboardLayoutProps) => {
  const { isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">{children}</main>
        <DashboardFooter />
      </SidebarInset>
    </SidebarProvider>
  )
})

DashboardLayoutContent.displayName = "DashboardLayoutContent"

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  )
}

export default DashboardLayout
