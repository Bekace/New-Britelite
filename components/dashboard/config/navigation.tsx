import {
  LayoutDashboard,
  ImageIcon,
  Video,
  Monitor,
  Calendar,
  BarChart3,
  Settings,
  Users,
  CreditCard,
  HelpCircle,
  Bell,
  User,
} from "lucide-react"

export interface NavigationItem {
  title: string
  href: string
  icon: any
  badge?: string
  children?: NavigationItem[]
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Content",
    href: "/dashboard/content",
    icon: ImageIcon,
    children: [
      {
        title: "Media Library",
        href: "/dashboard/media",
        icon: ImageIcon,
      },
      {
        title: "Videos",
        href: "/dashboard/videos",
        icon: Video,
      },
      {
        title: "Playlists",
        href: "/dashboard/playlists",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Display",
    href: "/dashboard/display",
    icon: Monitor,
    children: [
      {
        title: "Screens",
        href: "/dashboard/screens",
        icon: Monitor,
      },
      {
        title: "Schedules",
        href: "/dashboard/schedules",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Account",
    href: "/dashboard/account",
    icon: User,
    children: [
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
    ],
  },
]

export const adminNavigationItems: NavigationItem[] = [
  {
    title: "Admin",
    href: "/dashboard/admin",
    icon: Settings,
    children: [
      {
        title: "Users",
        href: "/dashboard/admin/users",
        icon: Users,
      },
      {
        title: "Plans",
        href: "/dashboard/admin/plans",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
]
