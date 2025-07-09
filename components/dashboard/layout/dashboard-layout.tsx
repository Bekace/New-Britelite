"use client"

import type React from "react"

import { DashboardProvider } from "../context/dashboard-context"
import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardFooter } from "./dashboard-footer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />

        <div className="flex-1 flex">
          <aside className="hidden md:flex w-64 flex-col border-r bg-background">
            <DashboardSidebar />
          </aside>

          <main className="flex-1 overflow-auto">
            <div className="container py-6">{children}</div>
          </main>
        </div>

        <DashboardFooter />
      </div>
    </DashboardProvider>
  )
}
