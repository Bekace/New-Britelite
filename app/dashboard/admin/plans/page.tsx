"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Monitor,
  HardDrive,
  PlaySquare,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { useDashboard } from "@/components/dashboard/context/dashboard-context"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: string
  max_screens: number
  max_storage_gb: number
  max_playlists: number
  is_active: boolean
  user_count: number
  created_at: string
  updated_at: string
}

interface PlanFormData {
  name: string
  description: string
  price: string
  billing_cycle: string
  max_screens: string
  max_storage_gb: string
  max_playlists: string
  is_active: boolean
}

interface DebugInfo {
  userRole: string | null
  hasSession: boolean
  apiResponse: any
  lastError: string | null
  requestCount: number
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    userRole: null,
    hasSession: false,
    apiResponse: null,
    lastError: null,
    requestCount: 0,
  })
  const [showDebug, setShowDebug] = useState(false)

  const { user } = useDashboard()

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    price: "",
    billing_cycle: "monthly",
    max_screens: "1",
    max_storage_gb: "1",
    max_playlists: "5",
    is_active: true,
  })

  const updateDebugInfo = (updates: Partial<DebugInfo>) => {
    setDebugInfo((prev) => ({ ...prev, ...updates }))
  }

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)

      updateDebugInfo({
        requestCount: debugInfo.requestCount + 1,
        userRole: user?.role || null,
        hasSession: !!user,
      })

      console.log("Fetching plans with user:", user?.email, "role:", user?.role)

      const response = await fetch("/api/admin/plans", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      updateDebugInfo({
        apiResponse: { status: response.status, data },
        lastError: null,
      })

      console.log("Plans API response:", { status: response.status, data })

      if (!response.ok) {
        throw new Error(`${response.status}: ${data.error || response.statusText}`)
      }

      if (data.success && data.plans) {
        setPlans(data.plans)
        console.log("Plans loaded successfully:", data.plans.length)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch plans"
      console.error("Error fetching plans:", errorMessage)
      setError(errorMessage)
      updateDebugInfo({ lastError: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : "/api/admin/plans"
      const method = editingPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: Number.parseFloat(formData.price),
          billing_cycle: formData.billing_cycle,
          max_screens: Number.parseInt(formData.max_screens),
          max_storage_gb: Number.parseInt(formData.max_storage_gb),
          max_playlists: Number.parseInt(formData.max_playlists),
          is_active: formData.is_active,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save plan")
      }

      await fetchPlans()
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save plan"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      setLoading(true)

      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete plan")
      }

      await fetchPlans()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete plan"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      billing_cycle: "monthly",
      max_screens: "1",
      max_storage_gb: "1",
      max_playlists: "5",
      is_active: true,
    })
    setEditingPlan(null)
  }

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      billing_cycle: plan.billing_cycle,
      max_screens: plan.max_screens.toString(),
      max_storage_gb: plan.max_storage_gb.toString(),
      max_playlists: plan.max_playlists.toString(),
      is_active: plan.is_active,
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
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
          <Button variant="outline" onClick={() => setShowDebug(!showDebug)}>
            {showDebug ? "Hide Debug" : "Show Debug"}
          </Button>
          <Button onClick={fetchPlans} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>User Role:</strong>
                <Badge variant={debugInfo.userRole === "admin" ? "default" : "secondary"}>
                  {debugInfo.userRole || "null"}
                </Badge>
              </div>
              <div>
                <strong>Has Session:</strong>
                <Badge variant={debugInfo.hasSession ? "default" : "destructive"}>
                  {debugInfo.hasSession ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <strong>Request Count:</strong>
                <Badge variant="outline">{debugInfo.requestCount}</Badge>
              </div>
              <div>
                <strong>Last Error:</strong>
                <Badge variant={debugInfo.lastError ? "destructive" : "default"}>
                  {debugInfo.lastError ? "Error" : "None"}
                </Badge>
              </div>
            </div>
            {debugInfo.lastError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{debugInfo.lastError}</AlertDescription>
              </Alert>
            )}
            {debugInfo.apiResponse && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">API Response</summary>
                <pre className="mt-2 p-2 bg-white rounded border overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.apiResponse, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">{plans.filter((p) => p.is_active).length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.reduce((sum, plan) => sum + (plan.user_count || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">Across all plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.length > 0
                ? formatPrice(plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length)
                : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Average plan price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(plans.reduce((sum, plan) => sum + plan.price * (plan.user_count || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Monthly potential</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Manage your subscription plans and pricing tiers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && plans.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatPrice(plan.price)}</div>
                        <div className="text-sm text-muted-foreground">per {plan.billing_cycle}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          {plan.max_screens} screens
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {plan.max_storage_gb}GB storage
                        </div>
                        <div className="flex items-center gap-1">
                          <PlaySquare className="h-3 w-3" />
                          {plan.max_playlists} playlists
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.user_count || 0}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(plan.is_active)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                          disabled={plan.user_count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && plans.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No plans found. Create your first plan to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update the plan details below." : "Create a new subscription plan."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="limits">Limits & Features</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Basic Plan"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="29.99"
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
                    placeholder="Describe what this plan includes..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_cycle">Billing Cycle</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
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

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active Plan</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="limits" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_screens">Max Screens</Label>
                    <Input
                      id="max_screens"
                      type="number"
                      min="1"
                      value={formData.max_screens}
                      onChange={(e) => setFormData({ ...formData, max_screens: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_storage_gb">Storage (GB)</Label>
                    <Input
                      id="max_storage_gb"
                      type="number"
                      min="1"
                      value={formData.max_storage_gb}
                      onChange={(e) => setFormData({ ...formData, max_storage_gb: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, max_playlists: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Plan Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Price:</strong>{" "}
                      {formData.price ? formatPrice(Number.parseFloat(formData.price)) : "$0.00"} per{" "}
                      {formData.billing_cycle}
                    </p>
                    <p>
                      <strong>Screens:</strong> {formData.max_screens} maximum
                    </p>
                    <p>
                      <strong>Storage:</strong> {formData.max_storage_gb}GB included
                    </p>
                    <p>
                      <strong>Playlists:</strong> {formData.max_playlists} maximum
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
