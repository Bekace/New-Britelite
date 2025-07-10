"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDashboard } from "../context/dashboard-context"
import { getNavigationConfig } from "../config/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const { user } = useDashboard()
  const pathname = usePathname()
  const navigationConfig = getNavigationConfig(user)

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background p-0 shadow-md"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-4">
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="text-sm font-bold">B</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <span className="text-sm font-bold">B</span>
            </div>
            <span className="text-lg font-semibold">Britelite</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navigationConfig.map((section, sectionIndex) => (
            <div key={section.title} className={section.className}>
              {!collapsed && (
                <h3
                  className={cn(
                    "mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    section.title === "Administration" && "text-orange-600",
                  )}
                >
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          collapsed ? "h-10 w-10 p-0" : "h-9 px-3",
                          isActive && "bg-secondary",
                          section.title === "Administration" &&
                            "hover:bg-orange-50 hover:text-orange-700 data-[state=open]:bg-orange-50",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
