"use client"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function DashboardFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>© 2024 BriteLite Digital Signage</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Version 1.0.0</span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <Link href="/support" className="text-muted-foreground hover:text-foreground">
            Support
          </Link>
        </div>
      </div>
    </footer>
  )
}
