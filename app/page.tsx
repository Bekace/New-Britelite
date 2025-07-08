"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, Play, BarChart3, Shield, Zap, Users, Check, Star, Crown } from "lucide-react"

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

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/plans")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const transformedPlans = data.plans.map((plan: any) => ({
              id: plan.id,
              name: plan.name,
              description: plan.description,
              price: Number.parseFloat(plan.price),
              billing_cycle: plan.billing_cycle,
              max_screens: plan.max_screens,
              max_storage_gb: plan.max_storage_gb,
              max_playlists: plan.max_playlists,
              features: plan.features || [],
              is_popular: plan.name === "Starter",
            }))
            setPlans(transformedPlans)
          }
        }
      } catch (error) {
        console.error("Error fetching plans:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return <Star className="h-5 w-5" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Monitor className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Digital Signage</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Manage Your Digital Signage
            <span className="block text-blue-600">With Ease</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create, manage, and deploy content to your digital displays from anywhere. Our platform makes digital
            signage simple and powerful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8 py-3 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-xl text-gray-600">Powerful features to manage your digital signage network</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Monitor className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Screen Management</CardTitle>
                <CardDescription>Easily manage multiple screens and displays from a single dashboard</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Play className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Playlist Creation</CardTitle>
                <CardDescription>Create dynamic playlists with images, videos, and documents</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>Track performance and get insights into your content engagement</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>Enterprise-grade security with 99.9% uptime guarantee</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>Push content updates instantly to all your connected displays</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>Work together with your team to create and manage content</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses using our platform to power their digital signage.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Select the perfect plan for your digital signage needs</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading plans...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                      {formatPlanFeatures(plan).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.features.length === 0 && plan.name !== "Free" && (
                      <div className="text-sm text-gray-500 italic">Basic features included</div>
                    )}

                    <Link href="/auth/register">
                      <Button className="w-full">{plan.price === 0 ? "Get Started Free" : "Start Free Trial"}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {plans.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-600">Plans will be available soon. Contact us for early access.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Monitor className="h-6 w-6" />
            <span className="text-xl font-bold">Digital Signage Platform</span>
          </div>
          <p className="text-gray-400">© 2024 Digital Signage Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
