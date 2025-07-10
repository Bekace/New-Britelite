"use client"
import { Badge } from "@/components/ui/badge"

export function DashboardFooter() {
  return (
    <footer className="border-t bg-background px-6 py-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>© 2024 Britelite Digital Signage</span>
          <Badge variant="outline" className="text-xs">
            v1.0.0
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
