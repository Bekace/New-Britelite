"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, ImageIcon, Play, DollarSign, Activity, Upload, Plus, BarChart3, TrendingUp } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  activeScreens: number
  mediaFiles: number
  activePlaylists: number
  monthlyCost: number
  storageUsed: number
  storageLimit: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeScreens: 12,
    mediaFiles: 248,
    activePlaylists: 8,
    monthlyCost: 180,
    storageUsed: 2.4,
    storageLimit: 10,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Here's an overview of your digital signage network</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Screens</CardTitle>
            <Monitor className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeScreens}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Media Files</CardTitle>
            <ImageIcon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediaFiles}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Playlists</CardTitle>
            <Play className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlaylists}</div>
            <p className="text-xs text-blue-600">3 scheduled</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <span>
                      {stats.storageUsed} GB of {stats.storageLimit} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(stats.storageUsed / stats.storageLimit) * 100}%` }}
                    ></div>
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

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/dashboard/billing">Upgrade Storage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/dashboard/screens">
                <div className="flex flex-col items-center space-y-2">
                  <Plus className="h-6 w-6" />
                  <span>Add Screen</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 bg-transparent" asChild>
              <Link href="/dashboard/upload">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-6 w-6" />
                  <span>Upload Media</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 bg-transparent" asChild>
              <Link href="/dashboard/playlists">
                <div className="flex flex-col items-center space-y-2">
                  <Play className="h-6 w-6" />
                  <span>Create Playlist</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 bg-transparent" asChild>
              <Link href="/dashboard/analytics">
                <div className="flex flex-col items-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>View Analytics</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
