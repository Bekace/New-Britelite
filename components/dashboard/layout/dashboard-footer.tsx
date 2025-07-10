"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function DashboardFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="flex h-12 items-center justify-between px-6">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>© 2024 Digital Signage Platform</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Version 1.0.0</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">System Status</span>
            <Badge variant="outline" className="text-xs">
              Operational
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  )
}
