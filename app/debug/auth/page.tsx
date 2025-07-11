"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface DebugStep {
  step: number
  name: string
  status: "success" | "failed" | "pending"
  result?: any
  error?: string
  stack?: string
}

interface DebugResult {
  timestamp: string
  email: string
  steps: DebugStep[]
  environment: {
    hasJwtSecret: boolean
    hasDatabaseUrl: boolean
    nodeEnv: string
  }
}

export default function AuthDebugPage() {
  const [email, setEmail] = useState("bekace.multimedia@gmail.com")
  const [password, setPassword] = useState("")
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebug = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      console.error("Debug failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Authentication Debug Tool</h1>
        <p className="text-gray-600">
          This tool helps diagnose authentication issues by testing each step of the login process.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Credentials</CardTitle>
          <CardDescription>Enter the email and password to test the authentication flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <Button onClick={runDebug} disabled={isLoading || !email || !password}>
            {isLoading ? "Running Debug..." : "Run Authentication Debug"}
          </Button>
        </CardContent>
      </Card>

      {debugResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(debugResult.environment.hasJwtSecret ? "success" : "failed")}
                  <span>JWT Secret: {debugResult.environment.hasJwtSecret ? "Present" : "Missing"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(debugResult.environment.hasDatabaseUrl ? "success" : "failed")}
                  <span>Database URL: {debugResult.environment.hasDatabaseUrl ? "Present" : "Missing"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <span>Environment: {debugResult.environment.nodeEnv}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication Steps</CardTitle>
              <CardDescription>Detailed breakdown of each authentication step</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debugResult.steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(step.status)}
                        <h3 className="font-semibold">
                          Step {step.step}: {step.name}
                        </h3>
                      </div>
                      {getStatusBadge(step.status)}
                    </div>

                    {step.status === "success" && step.result && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-700 mb-2">Result:</p>
                        <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                          {typeof step.result === "string" ? step.result : JSON.stringify(step.result, null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.status === "failed" && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-700 mb-2">Error:</p>
                        <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto">{step.error}</pre>
                        {step.stack && (
                          <details className="mt-2">
                            <summary className="text-sm font-medium text-red-700 cursor-pointer">Stack Trace</summary>
                            <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto mt-1">{step.stack}</pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Timestamp:</strong> {new Date(debugResult.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>Email Tested:</strong> {debugResult.email}
                </p>
                <p>
                  <strong>Total Steps:</strong> {debugResult.steps.length}
                </p>
                <p>
                  <strong>Successful Steps:</strong> {debugResult.steps.filter((s) => s.status === "success").length}
                </p>
                <p>
                  <strong>Failed Steps:</strong> {debugResult.steps.filter((s) => s.status === "failed").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
