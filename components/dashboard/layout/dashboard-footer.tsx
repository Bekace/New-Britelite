"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function DashboardFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>© 2024 Digital Signage Platform</span>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            System Online
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard/help" className="text-muted-foreground hover:text-foreground transition-colors">
            Help
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
