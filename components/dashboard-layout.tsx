"use client"

import type React from "react"

import { DashboardLayout } from "./dashboard"

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function DashboardLayoutWrapper({ children, title, description }: DashboardLayoutWrapperProps) {
  return (
    <DashboardLayout title={title} description={description}>
      {children}
    </DashboardLayout>
  )
}
