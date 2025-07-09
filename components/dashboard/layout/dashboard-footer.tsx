"use client"

import React from "react"
import Link from "next/link"

export const DashboardFooter = React.memo(function DashboardFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="flex h-12 items-center justify-between px-6 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>© 2024 BriteLite Digital Signage</span>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <span>Version 1.0.0</span>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
})
