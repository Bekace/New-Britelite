"use client"

import type React from "react"
import { DashboardProvider } from "@/components/dashboard/context/dashboard-context"
import { DashboardLayout as Layout } from "@/components/dashboard/layout/dashboard-layout"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <Layout>{children}</Layout>
    </DashboardProvider>
  )
}
