"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Plus,
  Edit,
  DollarSign,
  Users,
  Monitor,
  HardDrive,
  Play,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  BarChart3,
  Crown,
  Settings,
  Package,
} from "lucide-react"

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
  user_count?: number
  features?: PlanFeatureAssignment[]
}

interface PlanFeature {
  id: string
  name: string
  description: string
  feature_key: string
  is_active: boolean
}

interface PlanFeatureAssignment {
  id: string
  plan_id: string
  feature_id: string
  is_enabled: boolean
  limit_value?: number
  feature: PlanFeature
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [features, setFeatures] = useState<PlanFeature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false)
  const [selectedPlanForFeatures, setSelectedPlanForFeatures] = useState<Plan | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: 0,
    billing_cycle: "monthly",
    max_screens: 1,
    max_storage_gb: 1,
    max_playlists: 5,
  })

  const [newFeature, setNewFeature] = useState({
    name: "",
    description: "",
    feature_key: "",
  })

  const [isCreateFeatureDialogOpen, setIsCreateFeatureDialogOpen] = useState(false)

  useEffect(() => {
    fetchPlans()
    fetchFeatures()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFeatures = async () => {
    try {
      console.log("=== Fetching features from client ===") // Debug log
      const response = await fetch("/api/admin/features")
      console.log("Features API response status:", response.status) // Debug log

      if (response.ok) {
        const data = await response.json()
        console.log("Features API response data:", data) // Debug log
        console.log("Features array:", data.features) // Debug log
        console.log("Features count:", data.features?.length || 0) // Debug log

        setFeatures(data.features || [])

        if (data.features && data.features.length > 0) {
          console.log("✅ Features loaded successfully:", data.features.length)
        } else {
          console.log("⚠️ No features returned from API")
        }
      } else {
        const errorData = await response.json()
        console.error("❌ Features API error:", response.status, errorData)
      }
    } catch (error) {
      console.error("❌ Failed to fetch features:", error)
    }
  }

  const fetchPlanFeatures = async (planId: string) => {
    try {
      console.log("Fetching plan features for plan:", planId) // Debug log
      const response = await fetch(`/api/admin/plans/${planId}/features`)
      if (response.ok) {
        const data = await response.json()
        console.log("Plan features data:", data) // Debug log
        return data.features || []
      } else {
        console.error("Failed to fetch plan features:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch plan features:", error)
    }
    return []
  }

  const handleCreatePlan = async () => {
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: "Plan created successfully" })
        fetchPlans()
        setIsCreateDialogOpen(false)
        setNewPlan({
          name: "",
          description: "",
          price: 0,
          billing_cycle: "monthly",
          max_screens: 1,
          max_storage_gb: 1,
          max_playlists: 5,
        })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to create plan" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return

    try {
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: "Plan updated successfully" })
        fetchPlans()
        setIsEditDialogOpen(false)
        setEditingPlan(null)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update plan" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const handleTogglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: `Plan ${!isActive ? "activated" : "deactivated"} successfully` })
        fetchPlans()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update plan status" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const handleCreateFeature = async () => {
    try {
      const response = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeature),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: "Feature created successfully" })
        fetchFeatures()
        setIsCreateFeatureDialogOpen(false)
        setNewFeature({
          name: "",
          description: "",
          feature_key: "",
        })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to create feature" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const handleManagePlanFeatures = async (plan: Plan) => {
    const planFeatures = await fetchPlanFeatures(plan.id)
    setSelectedPlanForFeatures({ ...plan, features: planFeatures })
    setIsFeatureDialogOpen(true)
  }

  const handleTogglePlanFeature = async (planId: string, featureId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature_id: featureId, is_enabled: !isEnabled }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh plan features
        const updatedFeatures = await fetchPlanFeatures(planId)
        setSelectedPlanForFeatures((prev) => (prev ? { ...prev, features: updatedFeatures } : null))
        setMessage({ type: "success", text: "Plan feature updated successfully" })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update plan feature" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "starter":
        return <Zap className="h-5 w-5 text-blue-500" />
      case "professional":
        return <BarChart3 className="h-5 w-5 text-purple-500" />
      case "enterprise":
        return <Crown className="h-5 w-5 text-yellow-500" />
      default:
        return <Star className="h-5 w-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-600">Manage subscription plans, pricing, and features</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsCreateFeatureDialogOpen(true)}>
            <Package className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Plans</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Plans</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.filter((p) => p.is_active).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.reduce((sum, plan) => sum + (plan.user_count || 0), 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${plans.reduce((sum, plan) => sum + plan.price * (plan.user_count || 0), 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${!plan.is_active ? "opacity-60" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getPlanIcon(plan.name)}
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPlan(plan)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/{plan.billing_cycle}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <Monitor className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <div className="text-sm font-medium">{plan.max_screens}</div>
                      <div className="text-xs text-gray-500">Screens</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <HardDrive className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <div className="text-sm font-medium">{plan.max_storage_gb}GB</div>
                      <div className="text-xs text-gray-500">Storage</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <Play className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <div className="text-sm font-medium">{plan.max_playlists}</div>
                      <div className="text-xs text-gray-500">Playlists</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Subscribers: {plan.user_count || 0}</span>
                    <span>Revenue: ${((plan.user_count || 0) * plan.price).toLocaleString()}/mo</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleManagePlanFeatures(plan)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Features
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleTogglePlanStatus(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Debug Information */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-orange-700">
                <p>
                  <strong>Features loaded:</strong> {features.length}
                </p>
                <p>
                  <strong>Features array:</strong> {JSON.stringify(features.slice(0, 2), null, 2)}
                </p>
                <p>
                  <strong>API Status:</strong> Check browser console for detailed logs
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    console.log("Manual features refresh triggered")
                    fetchFeatures()
                  }}
                >
                  Refresh Features
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Available Features</CardTitle>
                  <CardDescription>Manage features that can be assigned to plans</CardDescription>
                </div>
                <Button onClick={() => setIsCreateFeatureDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {features.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No features found. This could mean:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Features haven't been added to the database yet</li>
                    <li>• The API is not returning data correctly</li>
                    <li>• There's a database connection issue</li>
                  </ul>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      console.log("Attempting to create first feature...")
                      setIsCreateFeatureDialogOpen(true)
                    }}
                  >
                    Create Your First Feature
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feature) => (
                    <Card key={feature.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{feature.name}</h3>
                        <Badge variant={feature.is_active ? "default" : "secondary"}>
                          {feature.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {feature.feature_key}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>Add a new subscription plan to your platform</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Plan Name</Label>
              <Input
                id="new-name"
                value={newPlan.name}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Starter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-price">Price</Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                value={newPlan.price}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                value={newPlan.description}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-billing">Billing Cycle</Label>
              <Select
                value={newPlan.billing_cycle}
                onValueChange={(value) => setNewPlan((prev) => ({ ...prev, billing_cycle: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-screens">Max Screens</Label>
              <Input
                id="new-screens"
                type="number"
                value={newPlan.max_screens}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, max_screens: Number.parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-storage">Storage (GB)</Label>
              <Input
                id="new-storage"
                type="number"
                value={newPlan.max_storage_gb}
                onChange={(e) =>
                  setNewPlan((prev) => ({ ...prev, max_storage_gb: Number.parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-playlists">Max Playlists</Label>
              <Input
                id="new-playlists"
                type="number"
                value={newPlan.max_playlists}
                onChange={(e) =>
                  setNewPlan((prev) => ({ ...prev, max_playlists: Number.parseInt(e.target.value) || 5 }))
                }
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
            <DialogDescription>Update plan details and pricing</DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Plan Name</Label>
                <Input
                  id="edit-name"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editingPlan.price}
                  onChange={(e) =>
                    setEditingPlan((prev) => (prev ? { ...prev, price: Number.parseFloat(e.target.value) || 0 } : null))
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-screens">Max Screens</Label>
                <Input
                  id="edit-screens"
                  type="number"
                  value={editingPlan.max_screens}
                  onChange={(e) =>
                    setEditingPlan((prev) =>
                      prev ? { ...prev, max_screens: Number.parseInt(e.target.value) || 1 } : null,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-storage">Storage (GB)</Label>
                <Input
                  id="edit-storage"
                  type="number"
                  value={editingPlan.max_storage_gb}
                  onChange={(e) =>
                    setEditingPlan((prev) =>
                      prev ? { ...prev, max_storage_gb: Number.parseInt(e.target.value) || 1 } : null,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-playlists">Max Playlists</Label>
                <Input
                  id="edit-playlists"
                  type="number"
                  value={editingPlan.max_playlists}
                  onChange={(e) =>
                    setEditingPlan((prev) =>
                      prev ? { ...prev, max_playlists: Number.parseInt(e.target.value) || 5 } : null,
                    )
                  }
                />
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editingPlan.is_active}
                  onCheckedChange={(checked) =>
                    setEditingPlan((prev) => (prev ? { ...prev, is_active: checked } : null))
                  }
                />
                <Label htmlFor="edit-active">Plan is active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Feature Dialog */}
      <Dialog open={isCreateFeatureDialogOpen} onOpenChange={setIsCreateFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Feature</DialogTitle>
            <DialogDescription>Add a new feature that can be assigned to plans</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feature-name">Feature Name</Label>
              <Input
                id="feature-name"
                value={newFeature.name}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Advanced Analytics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-key">Feature Key</Label>
              <Input
                id="feature-key"
                value={newFeature.feature_key}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, feature_key: e.target.value }))}
                placeholder="e.g., advanced_analytics"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-description">Description</Label>
              <Textarea
                id="feature-description"
                value={newFeature.description}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the feature"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFeatureDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFeature}>Create Feature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Features Dialog */}
      <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Plan Features</DialogTitle>
            <DialogDescription>
              {selectedPlanForFeatures && `Configure features for ${selectedPlanForFeatures.name} plan`}
            </DialogDescription>
          </DialogHeader>
          {selectedPlanForFeatures && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {features.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No features available. Create features first in the Features tab.</p>
                </div>
              ) : (
                features.map((feature) => {
                  const assignment = selectedPlanForFeatures.features?.find((f) => f.feature_id === feature.id)
                  const isEnabled = assignment?.is_enabled || false

                  return (
                    <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{feature.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {feature.feature_key}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() =>
                          handleTogglePlanFeature(selectedPlanForFeatures.id, feature.id, isEnabled)
                        }
                      />
                    </div>
                  )
                })
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsFeatureDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
