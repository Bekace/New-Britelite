"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ImageIcon,
  Monitor,
  BarChart3,
  Settings,
  Users,
  CreditCard,
  HelpCircle,
  Bell,
  User,
  DollarSign,
} from "lucide-react"
import { useDashboard } from "../context/dashboard-context"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Media Library", href: "/dashboard/media", icon: ImageIcon },
  { name: "Screens", href: "/dashboard/screens", icon: Monitor },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const userNavigation = [
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
]

const adminNavigation = [
  { name: "User Management", href: "/dashboard/admin/users", icon: Users },
  { name: "Plan Management", href: "/dashboard/admin/plans", icon: DollarSign },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useDashboard()

  const isAdmin = user?.role === "admin" || user?.role === "super_admin"
  const isSuperAdmin = user?.role === "super_admin"

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:block">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Digital Signage</h1>
      </div>

      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</h3>
          <div className="mt-2 space-y-1">
            {userNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-orange-600 uppercase tracking-wider">Administration</h3>
            <div className="mt-2 space-y-1">
              {adminNavigation.map((item) => {
                if (item.name === "Plan Management" && !isSuperAdmin) {
                  return null
                }
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-orange-50 text-orange-700"
                        : "text-gray-700 hover:bg-orange-50 hover:text-orange-700",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-orange-500" : "text-gray-400 group-hover:text-orange-500",
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
