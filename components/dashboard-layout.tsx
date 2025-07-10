"use client"

import type React from "react"
import { DashboardProvider, DashboardLayout } from "./dashboard"

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  return (
    <DashboardProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  )
}

export default DashboardLayoutWrapper
