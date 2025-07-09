"use client"

import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export const DashboardFooter = React.memo(function DashboardFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-6">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>© 2024 BriteLite Digital Signage</span>
          <Badge variant="outline" className="text-xs">
            v1.0.0
          </Badge>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <Link href="/dashboard/help" className="text-muted-foreground hover:text-foreground transition-colors">
            Help
          </Link>
          <Link href="/dashboard/help" className="text-muted-foreground hover:text-foreground transition-colors">
            Support
          </Link>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
})
