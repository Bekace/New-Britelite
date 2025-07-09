"use client"

import type React from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
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
  return (
    <DashboardProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex min-h-screen flex-col">
            <DashboardHeader title={title} description={description} />
            <main className="flex-1 p-4">{children}</main>
            <DashboardFooter />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  )
}
