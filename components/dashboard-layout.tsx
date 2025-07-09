"use client"

import type React from "react"
import { DashboardLayout as Layout } from "./dashboard"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <Layout title={title} description={description}>
      {children}
    </Layout>
  )
}

// Default export
export default DashboardLayout

// Named export for compatibility
