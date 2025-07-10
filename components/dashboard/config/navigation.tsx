import {
  LayoutDashboard,
  ImageIcon,
  Monitor,
  BarChart3,
  Settings,
  Users,
  CreditCard,
  Bell,
  User,
  HelpCircle,
  PlaySquare,
  DollarSign,
} from "lucide-react"

export interface NavigationItem {
  title: string
  href: string
  icon: any
  badge?: string
  roles?: string[]
}

export interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export function getNavigationConfig(user: any): NavigationSection[] {
  return [
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
          icon: PlaySquare,
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
          icon: DollarSign,
          roles: ["super_admin"],
        },
      ],
    },
  ]
}

export function filterNavigationByRole(sections: NavigationSection[], userRole?: string): NavigationSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles) return true
        return item.roles.includes(userRole || "")
      }),
    }))
    .filter((section) => section.items.length > 0)
}
