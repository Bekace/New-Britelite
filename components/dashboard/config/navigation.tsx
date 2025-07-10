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
}

const navigationConfig: NavigationSection[] = [
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
      },
      {
        title: "Screens",
        href: "/dashboard/screens",
        icon: Monitor,
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
        icon: Package,
        roles: ["super_admin"],
      },
      {
        title: "System Settings",
        href: "/dashboard/admin/system",
        icon: Shield,
        roles: ["super_admin"],
      },
    ],
  },
]

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
        },
        {
          title: "Screens",
          href: "/dashboard/screens",
          icon: Monitor,
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
          icon: Package,
          roles: ["super_admin"],
        },
        {
          title: "System Settings",
          href: "/dashboard/admin/system",
          icon: Shield,
          roles: ["super_admin"],
        },
      ],
    })
  }

  return sections
}

export function filterNavigationByRole(
  sections: NavigationSection[],
  userRole: string | undefined,
): NavigationSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles) return true
        return userRole && item.roles.includes(userRole)
      }),
    }))
    .filter((section) => section.items.length > 0)
}
