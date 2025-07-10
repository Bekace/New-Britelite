"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useDashboard } from "../context/dashboard-context"
import { getNavigationConfig, filterNavigationByRole } from "../config/navigation"

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useDashboard()
  const pathname = usePathname()

  const navigationSections = getNavigationConfig(user)
  const filteredSections = filterNavigationByRole(navigationSections, user?.role)

  return (
    <div
      className={cn("flex flex-col border-r bg-background transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">DS</span>
            </div>
            <span className="font-semibold">Digital Signage</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {filteredSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {!collapsed && (
                <h3
                  className={cn(
                    "mb-2 px-2 text-xs font-semibold uppercase tracking-wider",
                    section.title === "Administration"
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-muted-foreground",
                  )}
                >
                  {section.title}
                </h3>
              )}

              {/* Visual separator for admin section */}
              {section.title === "Administration" && !collapsed && (
                <div className="mb-3">
                  <Separator className="bg-orange-200 dark:bg-orange-800" />
                </div>
              )}

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  const isRestricted = item.roles && !item.roles.includes(user?.role || "")
                  const isAdminItem = section.title === "Administration"

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                        isActive && "bg-accent text-accent-foreground",
                        isRestricted && "opacity-50 cursor-not-allowed",
                        isAdminItem && "border-l-2 border-orange-300 dark:border-orange-700 ml-2",
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4 flex-shrink-0", isAdminItem && "text-orange-600 dark:text-orange-400")}
                      />
                      {!collapsed && (
                        <>
                          <span className={cn("flex-1", isAdminItem && "text-orange-900 dark:text-orange-100")}>
                            {item.title}
                          </span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                          {item.roles?.includes("super_admin") && user?.role === "super_admin" && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                user.role === "super_admin"
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200",
                              )}
                            >
                              {user.role === "super_admin" ? "Super Admin" : "Admin"}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Add separator after admin section */}
              {section.title === "Administration" && !collapsed && sectionIndex < filteredSections.length - 1 && (
                <div className="mt-3">
                  <Separator className="bg-orange-200 dark:bg-orange-800" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User info */}
      {!collapsed && user && (
        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.first_name} {user.last_name}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      user.role === "super_admin"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-blue-50 text-blue-700 border-blue-200",
                    )}
                  >
                    {user.role === "super_admin" ? "Super Admin" : "Admin"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
