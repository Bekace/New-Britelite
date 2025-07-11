"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

export default function AuthDebugPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [debugResults, setDebugResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebugTests = async () => {
    setIsLoading(true)
    setDebugResults(null)

    try {
      const response = await fetch("/api/debug/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      setDebugResults(result)
    } catch (error) {
      setDebugResults({
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/database", {
        method: "GET",
      })
      const result = await response.json()
      setDebugResults(result)
    } catch (error) {
      setDebugResults({
        error: "Database connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Tool</CardTitle>
            <CardDescription>
              This tool helps identify authentication issues by testing each step of the login process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debug-email">Email</Label>
                <Input
                  id="debug-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to test"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debug-password">Password</Label>
                <Input
                  id="debug-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to test"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={runDebugTests} disabled={isLoading || !email || !password}>
                {isLoading ? "Running Debug Tests..." : "Debug Authentication"}
              </Button>
              <Button variant="outline" onClick={testDatabaseConnection} disabled={isLoading}>
                {isLoading ? "Testing..." : "Test Database Connection"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {debugResults && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debugResults.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Error:</strong> {debugResults.error}
                      {debugResults.details && (
                        <div className="mt-2">
                          <strong>Details:</strong> {debugResults.details}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Full Debug Output:</Label>
                  <Textarea
                    value={JSON.stringify(debugResults, null, 2)}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Purpose:</strong> This tool tests each step of the authentication process
              </p>
              <p>
                <strong>Tests performed:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Database connection verification</li>
                <li>User lookup by email</li>
                <li>Password hash verification</li>
                <li>Session token generation</li>
                <li>Session storage</li>
                <li>Environment variable checks</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
