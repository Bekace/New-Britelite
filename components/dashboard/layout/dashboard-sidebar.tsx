"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useDashboard } from "../context/dashboard-context"
import { getFilteredNavigation } from "../config/navigation"
import { LogOut, User } from "lucide-react"

export function DashboardSidebar() {
  const { user, logout } = useDashboard()
  const pathname = usePathname()

  const navigation = getFilteredNavigation(user?.role)

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">DS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Digital Signage</span>
            <span className="text-xs text-muted-foreground">Platform</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          {navigation.map((section, index) => (
            <div key={section.title}>
              <SidebarGroup>
                <SidebarGroupLabel
                  className={
                    section.title === "Administration" ? "text-orange-600 font-semibold flex items-center gap-2" : ""
                  }
                >
                  {section.title}
                  {section.title === "Administration" && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      Admin
                    </Badge>
                  )}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      const isRestrictedToSuperAdmin =
                        item.roles?.includes("super_admin") && !item.roles?.includes("admin")

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={
                              section.title === "Administration"
                                ? "hover:bg-orange-50 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-900"
                                : ""
                            }
                          >
                            <Link href={item.href} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                              {isRestrictedToSuperAdmin && (
                                <Badge
                                  variant="outline"
                                  className="ml-auto bg-orange-50 text-orange-700 border-orange-200 text-xs"
                                >
                                  Super Admin
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              {index < navigation.length - 1 && section.title === "Account" && <Separator className="my-2" />}
            </div>
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="h-8 w-8 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
