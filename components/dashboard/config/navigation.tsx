import type React from "react"
import {
  LayoutDashboard,
  ImageIcon,
  Video,
  FileText,
  Monitor,
  Calendar,
  BarChart3,
  Settings,
  Users,
  CreditCard,
  Bell,
  HelpCircle,
  User,
} from "lucide-react"

export interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  adminOnly?: boolean
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Media Library",
    href: "/dashboard/media",
    icon: ImageIcon,
  },
  {
    title: "Videos",
    href: "/dashboard/videos",
    icon: Video,
    badge: "Soon",
  },
  {
    title: "Content",
    href: "/dashboard/content",
    icon: FileText,
  },
  {
    title: "Displays",
    href: "/dashboard/displays",
    icon: Monitor,
  },
  {
    title: "Scheduling",
    href: "/dashboard/scheduling",
    icon: Calendar,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export const accountItems: NavigationItem[] = [
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
    title: "Help & Support",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
]

export const adminItems: NavigationItem[] = [
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Plan Management",
    href: "/dashboard/admin/plans",
    icon: CreditCard,
    adminOnly: true,
  },
]
