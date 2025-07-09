"use client"

import type React from "react"

import { DashboardLayout as Layout } from "./dashboard/layout/dashboard-layout"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <Layout>{children}</Layout>
}

// Named export

// Default export
export default DashboardLayout
