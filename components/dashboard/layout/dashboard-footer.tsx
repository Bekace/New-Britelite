"use client"

import React from "react"

export const DashboardFooter = React.memo(() => {
  return (
    <footer className="border-t bg-gray-50 px-6 py-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>© 2024 Digital Signage Platform</span>
          <span>•</span>
          <span>Version 1.0.0</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/help" className="hover:text-gray-900">
            Help
          </a>
          <span>•</span>
          <a href="/privacy" className="hover:text-gray-900">
            Privacy
          </a>
          <span>•</span>
          <a href="/terms" className="hover:text-gray-900">
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
})

DashboardFooter.displayName = "DashboardFooter"
