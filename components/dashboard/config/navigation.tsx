import type React from "react"
import { BarChart3, Bell, CreditCard, FileImage, HelpCircle, Home, Settings, Shield, Users, Zap } from "lucide-react"

export interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  roles?: string[]
}

export interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export const navigationConfig: NavigationSection[] = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
      },
      {
        title: "Media Library",
        href: "/dashboard/media",
        icon: FileImage,
      },
      {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        href: "/dashboard/profile",
        icon: Settings,
      },
      {
        title: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
      },
      {
        title: "Notifications",
        href: "/dashboard/notifications",
        icon: Bell,
      },
      {
        title: "Help & Support",
        href: "/dashboard/help",
        icon: HelpCircle,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "User Management",
        href: "/dashboard/admin/users",
        icon: Users,
        roles: ["admin", "super_admin"],
      },
      {
        title: "Plan Management",
        href: "/dashboard/admin/plans",
        icon: Zap,
        roles: ["super_admin"],
      },
      {
        title: "System Settings",
        href: "/dashboard/admin/settings",
        icon: Shield,
        roles: ["super_admin"],
      },
    ],
  },
]

export function getFilteredNavigation(userRole?: string): NavigationSection[] {
  return navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles) return true
        return userRole && item.roles.includes(userRole)
      }),
    }))
    .filter((section) => section.items.length > 0)
}
