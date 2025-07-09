"use client"

import type React from "react"
import { DashboardLayout as ModularDashboardLayout } from "./dashboard"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <ModularDashboardLayout>{children}</ModularDashboardLayout>
}

export default DashboardLayout
