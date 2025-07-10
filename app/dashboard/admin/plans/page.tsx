"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Edit, Trash2, ChevronDown, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  max_screens: number
  max_storage_gb: number
  max_playlists: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DebugInfo {
  timestamp: string
  user: any
  cookies: any[]
  headers: any
  apiResponse: any
  error?: string
}

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_monthly: 0,
    price_yearly: 0,
    max_screens: 1,
    max_storage_gb: 1,
    max_playlists: 1,
    features: "",
    is_active: true,
  })

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching plans...")

      // Collect debug information
      const debugData: DebugInfo = {
        timestamp: new Date().toISOString(),
        user: null,
        cookies: [],
        headers: {},
        apiResponse: null,
      }

      // Get cookies
      debugData.cookies = document.cookie.split(";").map((cookie) => {
        const [name, value] = cookie.trim().split("=")
        return { name, value }
      })

      // Get current user first
      try {
        const userResponse = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })
        const userData = await userResponse.json()
        debugData.user = userData
        console.log("User data:", userData)
      } catch (userError) {
        console.error("Failed to get user:", userError)
        debugData.error = `User fetch failed: ${userError}`
      }

      // Fetch plans
      const response = await fetch("/api/admin/plans", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      debugData.headers = Object.fromEntries(response.headers.entries())

      const data = await response.json()
      debugData.apiResponse = data

      console.log("Plans API response:", data)

      setDebugInfo(debugData)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success && data.plans) {
        setPlans(data.plans)
        console.log("Plans loaded successfully:", data.plans.length)
      } else {
        throw new Error(data.error || "Failed to load plans")
      }
    } catch (err) {
      console.error("Error fetching plans:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load plans"
      setError(errorMessage)

      if (debugInfo) {
        setDebugInfo({
          ...debugInfo,
          error: errorMessage,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleCreatePlan = async () => {
    try {
      const planData = {
        ...formData,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f),
      }

      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(planData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create plan")
      }

      if (data.success) {
        toast.success("Plan created successfully")
        setIsCreateDialogOpen(false)
        resetForm()
        fetchPlans()
      } else {
        throw new Error(data.error || "Failed to create plan")
      }
    } catch (err) {
      console.error("Error creating plan:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create plan"
      toast.error(errorMessage)
    }
  }

  const handleEditPlan = async () => {
    if (!editingPlan) return

    try {
      const planData = {
        ...formData,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f),
      }

      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(planData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update plan")
      }

      if (data.success) {
        toast.success("Plan updated successfully")
        setIsEditDialogOpen(false)
        setEditingPlan(null)
        resetForm()
        fetchPlans()
      } else {
        throw new Error(data.error || "Failed to update plan")
      }
    } catch (err) {
      console.error("Error updating plan:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to update plan"
      toast.error(errorMessage)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete plan")
      }

      if (data.success) {
        toast.success("Plan deleted successfully")
        fetchPlans()
      } else {
        throw new Error(data.error || "Failed to delete plan")
      }
    } catch (err) {
      console.error("Error deleting plan:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to delete plan"
      toast.error(errorMessage)
    }
  }

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_screens: plan.max_screens,
      max_storage_gb: plan.max_storage_gb,
      max_playlists: plan.max_playlists,
      features: plan.features.join(", "),
      is_active: plan.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      max_screens: 1,
      max_storage_gb: 1,
      max_playlists: 1,
      features: "",
      is_active: true,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading plans...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
            Debug Info
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2 bg-transparent" onClick={fetchPlans}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Panel */}
      {showDebug && debugInfo && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              <ChevronDown className="h-4 w-4 mr-2" />
              Debug Information
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Debug Information</CardTitle>
                <CardDescription>Timestamp: {debugInfo.timestamp}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">User Information</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo.user, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Cookies ({debugInfo.cookies.length})</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo.cookies, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">API Response</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo.apiResponse, null, 2)}
                  </pre>
                </div>

                {debugInfo.error && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Error</h4>
                    <pre className="text-xs bg-red-50 p-2 rounded overflow-auto text-red-800">{debugInfo.error}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plans</CardTitle>
          <CardDescription>
            {plans.length} plan{plans.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No plans found</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && <div className="text-sm text-muted-foreground">{plan.description}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatCurrency(plan.price_monthly)}/month</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(plan.price_yearly)}/year</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{plan.max_screens} screens</div>
                        <div>{plan.max_storage_gb}GB storage</div>
                        <div>{plan.max_playlists} playlists</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>Add a new subscription plan with pricing and limits.</DialogDescription>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_screens">Max Screens</Label>
                <Input
                  id="max_screens"
                  type="number"
                  min="1"
                  value={formData.max_screens}
                  onChange={(e) => setFormData({ ...formData, max_screens: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_storage_gb">Max Storage (GB)</Label>
                <Input
                  id="max_storage_gb"
                  type="number"
                  min="1"
                  value={formData.max_storage_gb}
                  onChange={(e) => setFormData({ ...formData, max_storage_gb: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_playlists">Max Playlists</Label>
                <Input
                  id="max_playlists"
                  type="number"
                  min="1"
                  value={formData.max_playlists}
                  onChange={(e) => setFormData({ ...formData, max_playlists: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="e.g., HD Video Support, Analytics Dashboard, Priority Support"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update the plan details and pricing.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Plan Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic, Pro, Enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_is_active">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="edit_is_active">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_price_monthly">Monthly Price ($)</Label>
                <Input
                  id="edit_price_monthly"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_price_yearly">Yearly Price ($)</Label>
                <Input
                  id="edit_price_yearly"
                  type="number"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_max_screens">Max Screens</Label>
                <Input
                  id="edit_max_screens"
                  type="number"
                  min="1"
                  value={formData.max_screens}
                  onChange={(e) => setFormData({ ...formData, max_screens: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_max_storage_gb">Max Storage (GB)</Label>
                <Input
                  id="edit_max_storage_gb"
                  type="number"
                  min="1"
                  value={formData.max_storage_gb}
                  onChange={(e) => setFormData({ ...formData, max_storage_gb: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_max_playlists">Max Playlists</Label>
                <Input
                  id="edit_max_playlists"
                  type="number"
                  min="1"
                  value={formData.max_playlists}
                  onChange={(e) => setFormData({ ...formData, max_playlists: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_features">Features (comma-separated)</Label>
              <Textarea
                id="edit_features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="e.g., HD Video Support, Analytics Dashboard, Priority Support"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlan}>Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
