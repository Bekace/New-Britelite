"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useDashboard } from "@/components/dashboard/context/dashboard-context"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: "monthly" | "yearly"
  max_screens: number
  max_storage_gb: number
  max_playlists: number
  is_active: boolean
  created_at: string
  updated_at: string
  user_count?: number
}

interface PlanStats {
  totalPlans: number
  activePlans: number
  totalRevenue: number
  totalUsers: number
}

interface DebugInfo {
  userRole: string | undefined
  apiResponse: any
  lastError: string | null
  requestCount: number
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<PlanStats>({
    totalPlans: 0,
    activePlans: 0,
    totalRevenue: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    userRole: undefined,
    apiResponse: null,
    lastError: null,
    requestCount: 0,
  })
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    billing_cycle: "monthly" as "monthly" | "yearly",
    max_screens: 1,
    max_storage_gb: 1,
    max_playlists: 5,
    is_active: true,
  })

  const { user } = useDashboard()
  const { toast } = useToast()

  const updateDebugInfo = (updates: Partial<DebugInfo>) => {
    setDebugInfo((prev) => ({
      ...prev,
      ...updates,
      requestCount: prev.requestCount + 1,
    }))
  }

  const fetchPlans = async () => {
    try {
      setLoading(true)
      updateDebugInfo({
        userRole: user?.role,
        lastError: null,
      })

      console.log("Fetching plans for user:", user?.role)

      const response = await fetch("/api/admin/plans", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()

      updateDebugInfo({
        apiResponse: {
          status: response.status,
          ok: response.ok,
          data: data,
        },
      })

      console.log("Plans API Response:", {
        status: response.status,
        ok: response.ok,
        data: data,
      })

      if (response.ok && data.success) {
        setPlans(data.plans || [])

        // Calculate stats from plans data
        const totalPlans = data.plans?.length || 0
        const activePlans = data.plans?.filter((p: Plan) => p.is_active).length || 0
        const totalRevenue = data.plans?.reduce((sum: number, p: Plan) => sum + p.price * (p.user_count || 0), 0) || 0
        const totalUsers = data.plans?.reduce((sum: number, p: Plan) => sum + (p.user_count || 0), 0) || 0

        setStats({
          totalPlans,
          activePlans,
          totalRevenue,
          totalUsers,
        })
      } else {
        const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`
        updateDebugInfo({ lastError: errorMsg })
        console.error("Plans fetch error:", errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      updateDebugInfo({ lastError: errorMsg })
      console.error("Plans fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      updateDebugInfo({ userRole: user.role })
      if (user.role === "super_admin") {
        fetchPlans()
      }
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : "/api/admin/plans"
      const method = editingPlan ? "PUT" : "POST"

      console.log("Submitting plan:", { method, url, formData })

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      console.log("Plan submit response:", {
        status: response.status,
        ok: response.ok,
        data: data,
      })

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: `Plan ${editingPlan ? "updated" : "created"} successfully`,
        })
        setDialogOpen(false)
        resetForm()
        fetchPlans()
      } else {
        const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`
        console.error("Plan submit error:", errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Plan submit error:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingPlan ? "update" : "create"} plan`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      max_screens: plan.max_screens,
      max_storage_gb: plan.max_storage_gb,
      max_playlists: plan.max_playlists,
      is_active: plan.is_active,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Plan deleted successfully",
        })
        fetchPlans()
      } else {
        const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Plan delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setEditingPlan(null)
    setFormData({
      name: "",
      description: "",
      price: 0,
      billing_cycle: "monthly",
      max_screens: 1,
      max_storage_gb: 1,
      max_playlists: 5,
      is_active: true,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    )
  }

  if (user?.role !== "super_admin") {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-700 mb-4">You need super admin privileges to access this page.</p>
              <div className="text-sm text-red-600 space-y-1">
                <p>
                  Current Role: <span className="font-mono">{user?.role || "undefined"}</span>
                </p>
                <p>
                  Required Role: <span className="font-mono">super_admin</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="mt-4">
                {showDebug ? "Hide" : "Show"} Debug Info
              </Button>
              {showDebug && (
                <div className="mt-4 p-4 bg-red-100 rounded-lg text-left">
                  <pre className="text-xs text-red-800 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                  <DialogDescription>
                    {editingPlan
                      ? "Update the plan details below."
                      : "Create a new subscription plan with the details below."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Plan Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Basic, Pro, Enterprise"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Plan description..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing_cycle">Billing Cycle</Label>
                      <Select
                        value={formData.billing_cycle}
                        onValueChange={(value: "monthly" | "yearly") =>
                          setFormData({ ...formData, billing_cycle: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_screens">Max Screens</Label>
                      <Input
                        id="max_screens"
                        type="number"
                        min="1"
                        value={formData.max_screens}
                        onChange={(e) =>
                          setFormData({ ...formData, max_screens: Number.parseInt(e.target.value) || 1 })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_storage_gb">Storage (GB)</Label>
                      <Input
                        id="max_storage_gb"
                        type="number"
                        min="1"
                        value={formData.max_storage_gb}
                        onChange={(e) =>
                          setFormData({ ...formData, max_storage_gb: Number.parseInt(e.target.value) || 1 })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_playlists">Max Playlists</Label>
                      <Input
                        id="max_playlists"
                        type="number"
                        min="1"
                        value={formData.max_playlists}
                        onChange={(e) =>
                          setFormData({ ...formData, max_playlists: Number.parseInt(e.target.value) || 1 })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active Plan</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingPlan ? "Update Plan" : "Create Plan"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>User Role:</strong> <span className="font-mono">{debugInfo.userRole}</span>
                </div>
                <div>
                  <strong>Request Count:</strong> <span className="font-mono">{debugInfo.requestCount}</span>
                </div>
                <div>
                  <strong>Last Error:</strong>{" "}
                  <span className="font-mono text-red-600">{debugInfo.lastError || "None"}</span>
                </div>
                <div>
                  <strong>Plans Count:</strong> <span className="font-mono">{plans.length}</span>
                </div>
              </div>
              <div>
                <strong>Last API Response:</strong>
                <pre className="mt-2 p-2 bg-blue-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">{stats.activePlans} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlans}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly recurring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                ${plan.price}
                <span className="text-sm font-normal text-muted-foreground">/{plan.billing_cycle}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Max Screens:</span>
                  <span className="font-medium">{plan.max_screens}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Storage:</span>
                  <span className="font-medium">{plan.max_storage_gb} GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Playlists:</span>
                  <span className="font-medium">{plan.max_playlists}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Users:</span>
                  <span className="font-medium">{plan.user_count || 0}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(plan)} className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(plan.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No plans found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first subscription plan.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
