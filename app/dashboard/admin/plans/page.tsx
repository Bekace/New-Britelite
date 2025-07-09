"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, DollarSign, Users, Package } from "lucide-react"
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
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: "monthly" | "yearly"
  max_displays: number
  max_storage_gb: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    billing_cycle: "monthly" as "monthly" | "yearly",
    max_displays: 1,
    max_storage_gb: 1,
    features: "",
    is_active: true,
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
      toast.error("Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const planData = {
        ...formData,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f),
      }

      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : "/api/admin/plans"
      const method = editingPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      })

      if (response.ok) {
        toast.success(editingPlan ? "Plan updated successfully" : "Plan created successfully")
        setDialogOpen(false)
        resetForm()
        fetchPlans()
      } else {
        toast.error("Failed to save plan")
      }
    } catch (error) {
      console.error("Failed to save plan:", error)
      toast.error("Failed to save plan")
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      max_displays: plan.max_displays,
      max_storage_gb: plan.max_storage_gb,
      features: plan.features.join(", "),
      is_active: plan.is_active,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Plan deleted successfully")
        fetchPlans()
      } else {
        toast.error("Failed to delete plan")
      }
    } catch (error) {
      console.error("Failed to delete plan:", error)
      toast.error("Failed to delete plan")
    }
  }

  const resetForm = () => {
    setEditingPlan(null)
    setFormData({
      name: "",
      description: "",
      price: 0,
      billing_cycle: "monthly",
      max_displays: 1,
      max_storage_gb: 1,
      features: "",
      is_active: true,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Plan Management</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                <DialogDescription>
                  {editingPlan ? "Update the plan details below." : "Create a new subscription plan."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price ($)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max_displays" className="text-right">
                    Max Displays
                  </Label>
                  <Input
                    id="max_displays"
                    type="number"
                    value={formData.max_displays}
                    onChange={(e) => setFormData({ ...formData, max_displays: Number.parseInt(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max_storage_gb" className="text-right">
                    Storage (GB)
                  </Label>
                  <Input
                    id="max_storage_gb"
                    type="number"
                    value={formData.max_storage_gb}
                    onChange={(e) => setFormData({ ...formData, max_storage_gb: Number.parseInt(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="features" className="text-right">
                    Features
                  </Label>
                  <Input
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="col-span-3"
                    placeholder="Feature 1, Feature 2, Feature 3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_active" className="text-right">
                    Active
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingPlan ? "Update Plan" : "Create Plan"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">{plans.filter((p) => p.is_active).length} active plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {plans.length > 0 ? (plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per month average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Range</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${plans.length > 0 ? Math.min(...plans.map((p) => p.price)).toFixed(2) : "0.00"} - $
              {plans.length > 0 ? Math.max(...plans.map((p) => p.price)).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Min - Max pricing</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {plan.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.billing_cycle}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Max Displays:</span>
                    <span className="font-medium">{plan.max_displays}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Storage:</span>
                    <span className="font-medium">{plan.max_storage_gb} GB</span>
                  </div>
                </div>

                {plan.features.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
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
