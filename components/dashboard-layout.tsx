"use client"

import type React from "react"

import { DashboardLayout as ModularDashboardLayout } from "./dashboard"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <ModularDashboardLayout title={title} description={description}>
      {children}
    </ModularDashboardLayout>
  )
}
