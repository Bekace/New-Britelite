import type React from "react"
import {
  LayoutDashboard,
  ImageIcon,
  Video,
  Music,
  FileText,
  Monitor,
  Calendar,
  BarChart3,
  Settings,
  Users,
  CreditCard,
  HelpCircle,
  Bell,
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
    title: "Audio",
    href: "/dashboard/audio",
    icon: Music,
    badge: "Soon",
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    badge: "Soon",
  },
  {
    title: "Displays",
    href: "/dashboard/displays",
    icon: Monitor,
    badge: "Soon",
  },
  {
    title: "Playlists",
    href: "/dashboard/playlists",
    icon: Calendar,
    badge: "Soon",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    badge: "Soon",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
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
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    adminOnly: true,
  },
]
