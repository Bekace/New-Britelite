"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Check, Star, Zap, BarChart3, Crown, AlertCircle, Calendar } from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: string
  max_screens: number
  max_storage_gb: number
  max_playlists: number
  features: string[]
  is_popular?: boolean
}

interface UserPlan {
  current_plan: string
  max_screens: number
  max_storage_gb: number
  max_playlists: number
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockPlans: Plan[] = [
      {
        id: "free",
        name: "Free",
        description: "Perfect for testing and small projects",
        price: 0,
        billing_cycle: "monthly",
        max_screens: 1,
        max_storage_gb: 1,
        max_playlists: 3,
        features: ["1 Screen", "1GB Storage", "3 Playlists", "Basic Support", "Standard Templates"],
      },
      {
        id: "starter",
        name: "Starter",
        description: "Great for small businesses",
        price: 29.99,
        billing_cycle: "monthly",
        max_screens: 5,
        max_storage_gb: 10,
        max_playlists: 15,
        is_popular: true,
        features: [
          "5 Screens",
          "10GB Storage",
          "15 Playlists",
          "Real-time Updates",
          "Email Support",
          "Custom Branding",
          "Analytics Dashboard",
        ],
      },
      {
        id: "professional",
        name: "Professional",
        description: "Perfect for growing businesses",
        price: 79.99,
        billing_cycle: "monthly",
        max_screens: 20,
        max_storage_gb: 50,
        max_playlists: 50,
        features: [
          "20 Screens",
          "50GB Storage",
          "50 Playlists",
          "Advanced Analytics",
          "Priority Support",
          "API Access",
          "Custom Integrations",
          "Team Collaboration",
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For large organizations",
        price: 199.99,
        billing_cycle: "monthly",
        max_screens: 100,
        max_storage_gb: 200,
        max_playlists: 200,
        features: [
          "100 Screens",
          "200GB Storage",
          "Unlimited Playlists",
          "White-label Solution",
          "24/7 Phone Support",
          "Dedicated Account Manager",
          "Custom Development",
          "SLA Guarantee",
        ],
      },
    ]

    setPlans(mockPlans)
    setUserPlan({
      current_plan: "Free",
      max_screens: 1,
      max_storage_gb: 1,
      max_playlists: 3,
    })
    setIsLoading(false)
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Current Plan</span>
          </CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">{getPlanIcon(userPlan?.current_plan || "free")}</div>
              <div>
                <h3 className="text-xl font-semibold">{userPlan?.current_plan} Plan</h3>
                <p className="text-gray-600">
                  {userPlan?.max_screens} screens • {userPlan?.max_storage_gb}GB storage • {userPlan?.max_playlists}{" "}
                  playlists
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{userPlan?.current_plan === "Free" ? "$0" : "$29.99"}</div>
              <div className="text-sm text-gray-500">per month</div>
            </div>
          </div>

          {userPlan?.current_plan === "Free" && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're currently on the free plan. Upgrade to unlock more features and increase your limits.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.is_popular ? "ring-2 ring-blue-500" : ""}`}>
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
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
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={userPlan?.current_plan === plan.name ? "outline" : "default"}
                  disabled={userPlan?.current_plan === plan.name}
                >
                  {userPlan?.current_plan === plan.name ? "Current Plan" : plan.price === 0 ? "Downgrade" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Billing History</span>
          </CardTitle>
          <CardDescription>Your recent transactions and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Free Plan</p>
                <p className="text-sm text-gray-500">Started on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$0.00</p>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>

            <div className="text-center py-8 text-gray-500">
              <p>No billing history available</p>
              <p className="text-sm">Upgrade to a paid plan to see your billing history here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Can I change my plan anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">What happens if I exceed my limits?</h4>
            <p className="text-sm text-gray-600">
              We'll notify you when you're approaching your limits. You can upgrade your plan to increase your limits.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-gray-600">
              We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
