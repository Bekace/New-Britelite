"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

export default function AuthDebugPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebugTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        error: "Failed to run debug test",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "testing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "not_found":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      failed: "destructive",
      testing: "secondary",
      not_found: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Authentication Debug Tool</h1>
        <p className="text-muted-foreground">Test each step of the authentication process to identify issues</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Credentials</CardTitle>
          <CardDescription>Enter the email and password you're trying to authenticate with</CardDescription>
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
          <Button onClick={runDebugTest} disabled={loading || !email || !password} className="w-full">
            {loading ? "Running Debug Test..." : "Run Debug Test"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {results.error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Debug Test Failed:</strong> {results.details}
                {results.stack && (
                  <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">{results.stack}</pre>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Environment Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      {results.environment.hasJwtSecret ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">JWT Secret</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {results.environment.hasDatabaseUrl ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Database URL</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{results.environment.nodeEnv}</Badge>
                      <span className="text-sm">Environment</span>
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
                    {results.steps.map((step: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(step.status)}
                            <h3 className="font-medium">
                              Step {step.step}: {step.name}
                            </h3>
                          </div>
                          {getStatusBadge(step.status)}
                        </div>

                        {step.result && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-2">Result:</h4>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(step.result, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.error && (
                          <div className="mt-3">
                            <Alert variant="destructive">
                              <XCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Error:</strong> {step.error}
                                {step.stack && (
                                  <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">{step.stack}</pre>
                                )}
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>Test completed at: {new Date(results.timestamp).toLocaleString()}</p>
                    <p>Email tested: {results.email}</p>
                    <p>
                      Steps passed: {results.steps.filter((s: any) => s.status === "success").length} /{" "}
                      {results.steps.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
