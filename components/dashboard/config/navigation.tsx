import {
  BarChart3,
  FileImage,
  Monitor,
  Settings,
  Users,
  CreditCard,
  Bell,
  HelpCircle,
  User,
  Package,
  Shield,
} from "lucide-react"

export interface NavigationItem {
  title: string
  href: string
  icon: any
  badge?: string
  adminOnly?: boolean
  superAdminOnly?: boolean
}

export const mainNavigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Media Library",
    href: "/dashboard/media",
    icon: FileImage,
  },
  {
    title: "Displays",
    href: "/dashboard/displays",
    icon: Monitor,
    badge: "Soon",
  },
]

export const accountNavigationItems: NavigationItem[] = [
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
    title: "Help & Support",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
]

export const adminNavigationItems: NavigationItem[] = [
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Plan Management",
    href: "/dashboard/admin/plans",
    icon: Package,
    superAdminOnly: true,
  },
  {
    title: "System Settings",
    href: "/dashboard/admin/settings",
    icon: Shield,
    superAdminOnly: true,
  },
]

export const navigationItems = [...mainNavigationItems, ...accountNavigationItems, ...adminNavigationItems]
