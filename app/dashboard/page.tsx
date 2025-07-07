"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, ImageIcon, Play, DollarSign, Activity, Upload, Plus, BarChart3 } from "lucide-react"

interface DashboardStats {
  activeScreens: number
  mediaFiles: number
  activePlaylists: number
  monthlyCost: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    activeScreens: 12,
    mediaFiles: 248,
    activePlaylists: 8,
    monthlyCost: 180,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
        } else {
          router.push("/auth/login")
        }
      } catch (error) {
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Monitor className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Digital Signage Platform</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.first_name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" })
                  router.push("/auth/login")
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back! Here's an overview of your digital signage network.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Screens</CardTitle>
              <Monitor className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeScreens}</div>
              <p className="text-xs text-gray-500">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Media Files</CardTitle>
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mediaFiles}</div>
              <p className="text-xs text-gray-500">+12 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Playlists</CardTitle>
              <Play className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePlaylists}</div>
              <p className="text-xs text-gray-500">3 scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyCost}</div>
              <p className="text-xs text-gray-500">12 screens × $15</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Latest updates from your screens and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Screen "Lobby Display" came online</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New media file uploaded: "summer-promo.mp4"</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Playlist "Morning Announcements" updated</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Screen "Cafeteria TV" went offline</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Usage */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Storage Usage</span>
                </CardTitle>
                <CardDescription>Your current storage consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Used</span>
                      <span>2.4 GB of 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "24%" }}></div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Videos</span>
                      <span>1.8 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Images</span>
                      <span>0.5 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documents</span>
                      <span>0.1 GB</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Upgrade Storage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-16 bg-blue-600 hover:bg-blue-700">
                  <div className="flex flex-col items-center space-y-1">
                    <Plus className="h-5 w-5" />
                    <span>Add New Screen</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-16 bg-transparent">
                  <div className="flex flex-col items-center space-y-1">
                    <Upload className="h-5 w-5" />
                    <span>Upload Media</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-16 bg-transparent">
                  <div className="flex flex-col items-center space-y-1">
                    <Play className="h-5 w-5" />
                    <span>Create Playlist</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
