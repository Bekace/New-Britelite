"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, AlertTriangle, Database, User, Cookie, Settings } from "lucide-react"

interface TestResult {
  id: string
  name: string
  status: "pending" | "success" | "error"
  duration?: number
  timestamp: string
  error?: string
  data?: any
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [customQuery, setCustomQuery] = useState("SELECT id, email, role FROM users LIMIT 5;")
  const [queryResult, setQueryResult] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateResult = (id: string, updates: Partial<TestResult>) => {
    setResults((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], ...updates }
        return updated
      } else {
        return [...prev, { id, name: id, status: "pending", timestamp: new Date().toISOString(), ...updates }]
      }
    })
  }

  const runTest = async (testId: string, testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now()
    updateResult(testId, { name: testName, status: "pending", timestamp: new Date().toISOString() })

    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      updateResult(testId, {
        status: "success",
        duration,
        data: result,
        timestamp: new Date().toISOString(),
      })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      updateResult(testId, {
        status: "error",
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])

    try {
      // Test 1: Current User
      await runTest("current-user", "Current User (/api/auth/me)", async () => {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(`${response.status}: ${data.error || response.statusText}`)
        return data
      })

      // Test 2: Plans API
      await runTest("plans-api", "Plans API (/api/admin/plans)", async () => {
        const response = await fetch("/api/admin/plans", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(`${response.status}: ${data.error || response.statusText}`)
        return data
      })

      // Test 3: Database Connection
      await runTest("database", "Database Connection", async () => {
        const response = await fetch("/api/debug/database", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "SELECT 1 as test_connection;" }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(`${response.status}: ${data.error || response.statusText}`)
        return data
      })

      // Test 4: Session Debug
      await runTest("session", "Session Debug", async () => {
        const response = await fetch("/api/debug/session", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(`${response.status}: ${data.error || response.statusText}`)
        return data
      })

      // Test 5: Check User Roles
      await runTest("user-roles", "User Roles Check", async () => {
        const response = await fetch("/api/debug/database", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: "SELECT id, email, role FROM users WHERE email = 'bekace.multimedia@gmail.com';",
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(`${response.status}: ${data.error || response.statusText}`)
        return data
      })

      // Test 6: Check Role Constraints
      await runTest("role-constraints", "Role Constraints Check", async () => {
        const response = await fetch("/api/debug/database", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `SELECT column_name, data_type, is_nullable, column_default 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'role';`,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(`${response.status}: ${data.error || response.statusText}`)
        return data
      })

      // Test 7: Browser Cookies
      await runTest("cookies", "Browser Cookies", async () => {
        if (!mounted) return { allCookies: {}, hasSession: false, sessionValue: null }

        const allCookies = document.cookie.split(";").reduce(
          (acc, cookie) => {
            const [name, value] = cookie.trim().split("=")
            if (name) acc[name] = value || ""
            return acc
          },
          {} as Record<string, string>,
        )

        return {
          allCookies,
          hasSession: "session" in allCookies,
          sessionValue: allCookies.session || null,
        }
      })
    } catch (error) {
      console.error("Test suite error:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const executeCustomQuery = async () => {
    try {
      setQueryResult({ loading: true })
      const response = await fetch("/api/debug/database", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: customQuery }),
      })
      const data = await response.json()
      setQueryResult(data)
    } catch (error) {
      setQueryResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const fixUserRole = async () => {
    try {
      const response = await fetch("/api/debug/database", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `UPDATE users SET role = 'admin' WHERE email = 'bekace.multimedia@gmail.com' AND role != 'admin';`,
        }),
      })
      const data = await response.json()
      setQueryResult(data)
      if (data.success) {
        alert("Role updated successfully! Please refresh the page and run tests again.")
      }
    } catch (error) {
      setQueryResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Test passed
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">FAIL</Badge>
      case "pending":
        return <Badge variant="secondary">Running...</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  if (!mounted) {
    return <div className="p-6">Loading debug dashboard...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Debug Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive diagnostics for authentication, API endpoints, and database connectivity
          </p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning} size="lg">
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="details">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Test Results
              </CardTitle>
              <CardDescription>
                Automated tests for authentication, API endpoints, and database connectivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.length === 0 && !isRunning && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Click "Run All Tests" to start system diagnostics</AlertDescription>
                </Alert>
              )}

              {results.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium">{result.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                        {result.duration && ` • ${result.duration}ms`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                    {result.error && (
                      <Badge variant="outline" className="text-red-600">
                        {result.error}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Query Tool
              </CardTitle>
              <CardDescription>Execute SQL queries safely (SELECT, SHOW, DESCRIBE only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SQL Query</label>
                <Textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={executeCustomQuery}>Execute Query</Button>
                <Button onClick={fixUserRole} variant="outline">
                  Fix My Role (Set to Admin)
                </Button>
              </div>

              {queryResult && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Query Result:</h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Session Information
              </CardTitle>
              <CardDescription>Current user session and authentication status</CardDescription>
            </CardHeader>
            <CardContent>
              {results.find((r) => r.id === "session")?.data && (
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(results.find((r) => r.id === "session")?.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Browser Cookies
              </CardTitle>
              <CardDescription>Current browser cookies and session data</CardDescription>
            </CardHeader>
            <CardContent>
              {results.find((r) => r.id === "cookies")?.data && (
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(results.find((r) => r.id === "cookies")?.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>Raw response data from all tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {results.map((result) => (
                <div key={result.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{result.name}</h3>
                    <div className="flex items-center gap-2">
                      {result.duration && <Badge variant="outline">{result.duration}ms</Badge>}
                      <Badge variant="outline">{new Date(result.timestamp).toLocaleTimeString()}</Badge>
                      {getStatusBadge(result.status)}
                    </div>
                  </div>

                  {result.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}

                  {result.data && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Response Data:</h4>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>© 2024 Digital Signage Platform</p>
        <p>Version 1.0.0 • System Status: Operational</p>
      </footer>
    </div>
  )
}
