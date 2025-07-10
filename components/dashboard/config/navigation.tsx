import type React from "react"
import {
  LayoutDashboard,
  ImageIcon,
  Play,
  Monitor,
  BarChart3,
  Settings,
  User,
  Bell,
  CreditCard,
  HelpCircle,
  Users,
  Package,
  Shield,
} from "lucide-react"
import type { User as UserType } from "@/lib/auth"

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
  className?: string
}

export function getNavigationConfig(user: UserType | null): NavigationSection[] {
  const sections: NavigationSection[] = [
    {
      title: "Main",
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
          title: "Playlists",
          href: "/dashboard/playlists",
          icon: Play,
          badge: "Soon",
        },
        {
          title: "Screens",
          href: "/dashboard/screens",
          icon: Monitor,
          badge: "Soon",
        },
        {
          title: "Analytics",
          href: "/dashboard/analytics",
          icon: BarChart3,
          badge: "Soon",
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
          title: "Notifications",
          href: "/dashboard/notifications",
          icon: Bell,
        },
        {
          title: "Billing",
          href: "/dashboard/billing",
          icon: CreditCard,
        },
        {
          title: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
          badge: "Soon",
        },
        {
          title: "Help & Support",
          href: "/dashboard/help",
          icon: HelpCircle,
        },
      ],
    },
  ]

  // Add admin section if user has admin or super_admin role
  if (user && (user.role === "admin" || user.role === "super_admin")) {
    sections.push({
      title: "Administration",
      className: "border-t border-orange-200 pt-4 mt-4",
      items: [
        {
          title: "User Management",
          href: "/dashboard/admin/users",
          icon: Users,
          roles: ["admin", "super_admin"],
        },
        ...(user.role === "super_admin"
          ? [
              {
                title: "Plan Management",
                href: "/dashboard/admin/plans",
                icon: Package,
                roles: ["super_admin"],
              },
              {
                title: "System Settings",
                href: "/dashboard/admin/system",
                icon: Shield,
                roles: ["super_admin"],
              },
            ]
          : []),
      ],
    })
  }

  return sections
}
