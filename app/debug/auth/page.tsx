"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "failed":
        return "bg-red-500"
      case "not_found":
        return "bg-yellow-500"
      case "testing":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
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
          <CardTitle>Test Authentication</CardTitle>
          <CardDescription>Enter credentials to test the authentication flow</CardDescription>
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
            <Alert>
              <AlertDescription>
                <strong>Error:</strong> {results.error}
                {results.details && (
                  <div className="mt-2">
                    <strong>Details:</strong> {results.details}
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">JWT Secret:</span>{" "}
                      <Badge variant={results.environment.hasJwtSecret ? "default" : "destructive"}>
                        {results.environment.hasJwtSecret ? "Present" : "Missing"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Database URL:</span>{" "}
                      <Badge variant={results.environment.hasDatabaseUrl ? "default" : "destructive"}>
                        {results.environment.hasDatabaseUrl ? "Present" : "Missing"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Environment:</span>{" "}
                      <Badge variant="outline">{results.environment.nodeEnv}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Timestamp:</span>{" "}
                      <span className="text-sm text-gray-600">{results.timestamp}</span>
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
                          <h3 className="font-medium">
                            Step {step.step}: {step.name}
                          </h3>
                          <Badge className={getStatusColor(step.status)}>{step.status}</Badge>
                        </div>

                        {step.result && (
                          <div className="mt-2">
                            <h4 className="font-medium text-sm mb-1">Result:</h4>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(step.result, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.error && (
                          <div className="mt-2">
                            <h4 className="font-medium text-sm mb-1 text-red-600">Error:</h4>
                            <div className="bg-red-50 p-2 rounded text-sm text-red-700">{step.error}</div>
                          </div>
                        )}

                        {step.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-medium">Stack Trace</summary>
                            <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">{step.stack}</pre>
                          </details>
                        )}
                      </div>
                    ))}
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
