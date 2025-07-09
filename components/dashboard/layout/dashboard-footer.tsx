"use client"

import React from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export const DashboardFooter = React.memo(() => {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>© 2024 BriteLite Digital Signage</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Version 1.0.0</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/help" className="hover:text-foreground">
              Help
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
})

DashboardFooter.displayName = "DashboardFooter"
