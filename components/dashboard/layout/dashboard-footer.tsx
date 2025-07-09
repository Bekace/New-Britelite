"use client"
import Link from "next/link"

export function DashboardFooter() {
  return (
    <footer className="border-t bg-white px-6 py-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>© 2024 Digital Signage Platform</span>
          <Link href="/dashboard/help" className="hover:text-gray-700">
            Help
          </Link>
          <Link href="/dashboard/privacy" className="hover:text-gray-700">
            Privacy
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <span>Version 1.0.0</span>
          <div className="h-2 w-2 bg-green-500 rounded-full" title="System Status: Operational" />
        </div>
      </div>
    </footer>
  )
}
