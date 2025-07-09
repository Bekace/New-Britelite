"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useDashboard } from "../context/dashboard-context"
import { getFilteredNavigation } from "../config/navigation"

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user } = useDashboard()
  const navigation = getFilteredNavigation(user?.role)

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">BriteLite Digital</h2>
          <div className="space-y-1">
            {navigation.map((section, sectionIndex) => (
              <div key={section.title}>
                {sectionIndex > 0 && <Separator className="my-4" />}

                <div className="px-3 py-2">
                  <h3
                    className={cn(
                      "mb-2 px-4 text-sm font-medium tracking-tight",
                      section.title === "Administration"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {section.title}
                    {section.title === "Administration" && user?.role === "super_admin" && (
                      <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-600">
                        Super Admin
                      </Badge>
                    )}
                    {section.title === "Administration" && user?.role === "admin" && (
                      <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-600">
                        Admin
                      </Badge>
                    )}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Button
                        key={item.href}
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          section.title === "Administration" &&
                            "border-l-2 border-l-orange-200 hover:border-l-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950",
                        )}
                        asChild
                      >
                        <Link href={item.href}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.title}
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
