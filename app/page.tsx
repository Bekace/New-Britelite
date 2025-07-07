"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Monitor, Play, BarChart3, Shield, Zap, Users } from "lucide-react"

export default function HomePage() {
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
