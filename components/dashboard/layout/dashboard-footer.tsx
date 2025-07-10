"use client"

export function DashboardFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>© 2024 Digital Signage Platform. All rights reserved.</div>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-gray-700">
            Privacy
          </a>
          <a href="#" className="hover:text-gray-700">
            Terms
          </a>
          <a href="#" className="hover:text-gray-700">
            Support
          </a>
        </div>
      </div>
    </footer>
  )
}
