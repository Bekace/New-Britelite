"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, Mail, Smartphone, AlertTriangle, CheckCircle, Info, Settings, Trash2 } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
  read: boolean
}

interface NotificationSettings {
  email: {
    screenOffline: boolean
    contentUpdates: boolean
    systemAlerts: boolean
    weeklyReports: boolean
  }
  push: {
    screenOffline: boolean
    contentUpdates: boolean
    systemAlerts: boolean
  }
}

export default function NotificationsPage() {
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Screen Offline",
      message: "Screen 'Lobby Display' has gone offline and needs attention.",
      type: "error",
      timestamp: "2 minutes ago",
      read: false,
    },
    {
      id: "2",
      title: "Content Updated",
      message: "Playlist 'Morning Announcements' has been successfully updated.",
      type: "success",
      timestamp: "15 minutes ago",
      read: false,
    },
    {
      id: "3",
      title: "Storage Warning",
      message: "You're using 85% of your storage limit. Consider upgrading your plan.",
      type: "warning",
      timestamp: "1 hour ago",
      read: true,
    },
    {
      id: "4",
      title: "New Feature Available",
      message: "Check out our new analytics dashboard with enhanced reporting features.",
      type: "info",
      timestamp: "2 hours ago",
      read: true,
    },
  ])

  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      screenOffline: true,
      contentUpdates: true,
      systemAlerts: true,
      weeklyReports: false,
    },
    push: {
      screenOffline: true,
      contentUpdates: false,
      systemAlerts: true,
    },
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-100 text-red-800"
      case "success":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const updateEmailSetting = (key: keyof NotificationSettings["email"]) => {
    setSettings((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key],
      },
    }))
  }

  const updatePushSetting = (key: keyof NotificationSettings["push"]) => {
    setSettings((prev) => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: !prev.push[key],
      },
    }))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage your notification preferences and view recent alerts</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Recent Notifications</span>
          </CardTitle>
          <CardDescription>Your latest system alerts and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border ${
                  notification.read ? "bg-gray-50" : "bg-white border-blue-200"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <Badge className={`text-xs ${getNotificationBadgeColor(notification.type)}`}>
                      {notification.type}
                    </Badge>
                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.timestamp}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Button variant="outline">Load More Notifications</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Email Notifications</h3>
            </div>
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-screen-offline" className="text-sm font-medium">
                    Screen Offline Alerts
                  </Label>
                  <p className="text-xs text-gray-500">Get notified when screens go offline</p>
                </div>
                <Switch
                  id="email-screen-offline"
                  checked={settings.email.screenOffline}
                  onCheckedChange={() => updateEmailSetting("screenOffline")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-content-updates" className="text-sm font-medium">
                    Content Updates
                  </Label>
                  <p className="text-xs text-gray-500">Notifications about playlist and media changes</p>
                </div>
                <Switch
                  id="email-content-updates"
                  checked={settings.email.contentUpdates}
                  onCheckedChange={() => updateEmailSetting("contentUpdates")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-system-alerts" className="text-sm font-medium">
                    System Alerts
                  </Label>
                  <p className="text-xs text-gray-500">Important system notifications and updates</p>
                </div>
                <Switch
                  id="email-system-alerts"
                  checked={settings.email.systemAlerts}
                  onCheckedChange={() => updateEmailSetting("systemAlerts")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-weekly-reports" className="text-sm font-medium">
                    Weekly Reports
                  </Label>
                  <p className="text-xs text-gray-500">Weekly summary of your digital signage performance</p>
                </div>
                <Switch
                  id="email-weekly-reports"
                  checked={settings.email.weeklyReports}
                  onCheckedChange={() => updateEmailSetting("weeklyReports")}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Push Notifications */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Smartphone className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Push Notifications</h3>
            </div>
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-screen-offline" className="text-sm font-medium">
                    Screen Offline Alerts
                  </Label>
                  <p className="text-xs text-gray-500">Instant alerts when screens go offline</p>
                </div>
                <Switch
                  id="push-screen-offline"
                  checked={settings.push.screenOffline}
                  onCheckedChange={() => updatePushSetting("screenOffline")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-content-updates" className="text-sm font-medium">
                    Content Updates
                  </Label>
                  <p className="text-xs text-gray-500">Push notifications for content changes</p>
                </div>
                <Switch
                  id="push-content-updates"
                  checked={settings.push.contentUpdates}
                  onCheckedChange={() => updatePushSetting("contentUpdates")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-system-alerts" className="text-sm font-medium">
                    System Alerts
                  </Label>
                  <p className="text-xs text-gray-500">Critical system notifications</p>
                </div>
                <Switch
                  id="push-system-alerts"
                  checked={settings.push.systemAlerts}
                  onCheckedChange={() => updatePushSetting("systemAlerts")}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
