"use client"

import { Badge } from "@/components/ui/badge"

export function DashboardFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">© 2024 BriteLite Digital. All rights reserved.</p>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600 border-green-200">
            System Online
          </Badge>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <a href="/help" className="hover:underline">
              Help
            </a>
            <span>•</span>
            <a href="/privacy" className="hover:underline">
              Privacy
            </a>
            <span>•</span>
            <a href="/terms" className="hover:underline">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
