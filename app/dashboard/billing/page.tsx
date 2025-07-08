"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Star, Zap, BarChart3, Crown } from "lucide-react"

interface Feature {
  id: string
  name: string
  description: string
  feature_key: string
}

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: string
  max_screens: number
  max_storage_gb: number
  max_playlists: number
  features: Feature[]
  is_popular?: boolean
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  current_plan?: string
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansResponse = await fetch("/api/plans")
        if (plansResponse.ok) {
          const plansData = await plansResponse.json()
          if (plansData.success) {
            setPlans(plansData.plans)
          }
        }

        // Fetch user data
        const userResponse = await fetch("/api/auth/me")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.success) {
            setUser(userData.user)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "starter":
        return <Zap className="h-5 w-5" />
      case "professional":
        return <BarChart3 className="h-5 w-5" />
      case "enterprise":
        return <Crown className="h-5 w-5" />
      default:
        return <Star className="h-5 w-5" />
    }
  }

  const formatPlanFeatures = (plan: Plan) => {
    const baseFeatures = [
      `${plan.max_screens} Screen${plan.max_screens !== 1 ? "s" : ""}`,
      `${plan.max_storage_gb}GB Storage`,
      `${plan.max_playlists} Playlist${plan.max_playlists !== 1 ? "s" : ""}`,
    ]

    const assignedFeatures = plan.features.map((feature) => feature.name)

    return [...baseFeatures, ...assignedFeatures]
  }

  const getCurrentPlan = () => {
    if (!user?.current_plan) return null
    return plans.find((plan) => plan.id === user.current_plan)
  }

  const currentPlan = getCurrentPlan()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan Section */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">{getPlanIcon(currentPlan.name)}</div>
              Current Plan: {currentPlan.name}
            </CardTitle>
            <CardDescription>
              You are currently on the {currentPlan.name} plan (${currentPlan.price}/month)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentPlan.max_screens}</div>
                <div className="text-sm text-gray-600">Screens</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{currentPlan.max_storage_gb}GB</div>
                <div className="text-sm text-gray-600">Storage</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{currentPlan.max_playlists}</div>
                <div className="text-sm text-gray-600">Playlists</div>
              </div>
            </div>

            {currentPlan.features.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Included Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            <div className="flex gap-2">
              <Button variant="outline">Manage Subscription</Button>
              <Button variant="outline">Download Invoice</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${currentPlan?.id === plan.id ? "ring-2 ring-blue-500" : ""}`}>
              {currentPlan?.id === plan.id && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div
                    className={`p-3 rounded-lg ${
                      plan.name === "Free"
                        ? "bg-gray-100"
                        : plan.name === "Starter"
                          ? "bg-blue-100"
                          : plan.name === "Professional"
                            ? "bg-purple-100"
                            : "bg-yellow-100"
                    }`}
                  >
                    {getPlanIcon(plan.name)}
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/month</span>}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {formatPlanFeatures(plan).map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.features.length === 0 && plan.name !== "Free" && (
                  <div className="text-sm text-gray-500 italic">Basic features included</div>
                )}

                <Button
                  className="w-full"
                  variant={currentPlan?.id === plan.id ? "outline" : "default"}
                  disabled={currentPlan?.id === plan.id}
                >
                  {currentPlan?.id === plan.id
                    ? "Current Plan"
                    : plan.price === 0
                      ? "Downgrade to Free"
                      : "Upgrade Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No plans available at the moment.</p>
        </div>
      )}
    </div>
  )
}
