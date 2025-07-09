import {
  Home,
  BarChart3,
  ImageIcon,
  Play,
  Upload,
  Monitor,
  Calendar,
  Activity,
  Building,
  CreditCard,
  Settings,
  Users,
  Shield,
} from "lucide-react"

export const navigationItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Content Management",
    items: [
      {
        title: "Media Library",
        url: "/dashboard/media",
        icon: ImageIcon,
      },
      {
        title: "Playlists",
        url: "/dashboard/playlists",
        icon: Play,
      },
      {
        title: "Upload",
        url: "/dashboard/upload",
        icon: Upload,
      },
    ],
  },
  {
    title: "Display Management",
    items: [
      {
        title: "Screens",
        url: "/dashboard/screens",
        icon: Monitor,
      },
      {
        title: "Scheduling",
        url: "/dashboard/scheduling",
        icon: Calendar,
      },
      {
        title: "Activity",
        url: "/dashboard/activity",
        icon: Activity,
      },
    ],
  },
]

export const accountItems = [
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: Building,
      },
      {
        title: "Billing",
        url: "/dashboard/billing",
        icon: CreditCard,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
]

export const adminItems = [
  {
    title: "Administration",
    items: [
      {
        title: "User Management",
        url: "/dashboard/admin/users",
        icon: Users,
      },
      {
        title: "Plan Management",
        url: "/dashboard/admin/plans",
        icon: Shield,
      },
    ],
  },
]
