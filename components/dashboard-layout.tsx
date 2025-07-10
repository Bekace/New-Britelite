"use client"

import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./dashboard/layout/dashboard-sidebar"
import { DashboardHeader } from "./dashboard/layout/dashboard-header"
import { DashboardFooter } from "./dashboard/layout/dashboard-footer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</main>
        <DashboardFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardLayout
