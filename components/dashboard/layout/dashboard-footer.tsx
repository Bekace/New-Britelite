"use client"

import React from "react"
import Link from "next/link"

export const DashboardFooter = React.memo(() => {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>© 2024 Digital Signage Platform</span>
          <Link href="/privacy" className="hover:text-gray-700">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-gray-700">
            Terms
          </Link>
          <Link href="/support" className="hover:text-gray-700">
            Support
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <span>Version 1.0.0</span>
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
})

DashboardFooter.displayName = "DashboardFooter"
