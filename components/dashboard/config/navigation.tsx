import type React from "react"
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
  Receipt,
} from "lucide-react"

export interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  roles?: ("user" | "admin" | "super_admin")[]
}

export interface NavigationSection {
  title?: string
  items: NavigationItem[]
  roles?: ("user" | "admin" | "super_admin")[]
}

export const navigationConfig: NavigationSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Media Library",
        href: "/dashboard/media",
        icon: ImageIcon,
      },
      {
        title: "Screens",
        href: "/dashboard/screens",
        icon: Monitor,
      },
      {
        title: "Playlists",
        href: "/dashboard/playlists",
        icon: BarChart3,
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
        icon: User,
      },
      {
        title: "Billing",
        href: "/dashboard/billing",
        icon: Receipt,
      },
      {
        title: "Notifications",
        href: "/dashboard/notifications",
        icon: Bell,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
      {
        title: "Help",
        href: "/dashboard/help",
        icon: HelpCircle,
      },
    ],
  },
  {
    title: "Administration",
    roles: ["admin", "super_admin"],
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
        icon: CreditCard,
        roles: ["super_admin"],
      },
    ],
  },
]

export function getFilteredNavigation(userRole?: string): NavigationSection[] {
  if (!userRole) return navigationConfig.filter((section) => !section.roles)

  return navigationConfig
    .filter((section) => !section.roles || section.roles.includes(userRole as any))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(userRole as any)),
    }))
    .filter((section) => section.items.length > 0)
}
