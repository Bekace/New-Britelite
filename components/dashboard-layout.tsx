import type React from "react"
import { LayoutDashboard, ImageIcon, Settings, User, HelpCircle } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { SidebarNavItem } from "@/components/sidebar-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
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
    title: "Account",
    href: "/dashboard/account",
    icon: User,
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
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r p-4">
        <MainNav className="mb-6" />
        <div className="py-4">
          {navigationItems.map((item) => (
            <SidebarNavItem key={item.title} title={item.title} href={item.href} icon={item.icon} />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
