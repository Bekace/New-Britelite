"use client"

import type React from "react"
import { DashboardLayout as Layout } from "./dashboard"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <Layout>{children}</Layout>
}
