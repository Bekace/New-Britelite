"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, AlertTriangle, Database, User, Cookie, Server } from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "pending"
  duration?: number
  timestamp: string
  error?: string
  data?: any
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [sqlQuery, setSqlQuery] = useState("SELECT id, email, role FROM users LIMIT 5;")
  const [customResults, setCustomResults] = useState<TestResult[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setResults((prev) => {
      const existingIndex = prev.findIndex((r) => r.name === name)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], ...updates }
        return updated
      } else {
        return [...prev, { name, ...updates } as TestResult]
      }
    })
  }

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    const startTime = Date.now()
    const timestamp = new Date().toLocaleTimeString()

    updateResult(name, {
      status: "pending",
      timestamp,
    })

    try {
      const data = await testFn()
      const duration = Date.now() - startTime

      updateResult(name, {
        status: "success",
        duration,
        timestamp,
        data,
      })
    } catch (error) {
      const duration = Date.now() - startTime

      updateResult(name, {
        status: "error",
        duration,
        timestamp,
        error: error instanceof Error ? error.message : "Unknown error",
        data: error,
      })
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Current User Authentication
    await runTest("Current User (/api/auth/me)", async () => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(`${response.status}: ${data.error || response.statusText}`)
      }
      return data
    })

    // Test 2: Plans API
    await runTest("Plans API (/api/admin/plans)", async () => {
      const response = await fetch("/api/admin/plans", {
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(`${response.status}: ${data.error || response.statusText}`)
      }
      return data
    })

    // Test 3: Database Connection
    await runTest("Database Connection", async () => {
      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: "SELECT 1 as test_connection;",
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(`${response.status}: ${data.error || response.statusText}`)
      }
      return data
    })

    // Test 4: Session Debug
    await runTest("Session Debug", async () => {
      const response = await fetch("/api/debug/session", {
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(`${response.status}: ${data.error || response.statusText}`)
      }
      return data
    })

    // Test 5: Check Super Admin Users
    await runTest("Super Admin Users", async () => {
      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: "SELECT id, email, role FROM users WHERE role = 'super_admin';",
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(`${response.status}: ${data.error || response.statusText}`)
      }
      return data
    })

    // Test 6: Browser Cookies
    await runTest("Browser Cookies", async () => {
      if (!mounted) return { error: "Not mounted" }

      const allCookies = document.cookie.split(";").reduce((cookies: Record<string, string>, cookie) => {
        const [name, value] = cookie.trim().split("=")
        if (name && value) {
          cookies[name] = decodeURIComponent(value)
        }
        return cookies
      }, {})

      const sessionCookie = allCookies.session

      return {
        allCookies,
        hasSession: !!sessionCookie,
        sessionValue: sessionCookie || null,
      }
    })

    setIsRunning(false)
  }

  const runCustomQuery = async () => {
    if (!sqlQuery.trim()) return

    const startTime = Date.now()
    const timestamp = new Date().toLocaleTimeString()
    const queryName = `Custom Query: ${sqlQuery.substring(0, 50)}...`

    setCustomResults((prev) => [
      ...prev,
      {
        name: queryName,
        status: "pending",
        timestamp,
      },
    ])

    try {
      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: sqlQuery,
        }),
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`${response.status}: ${data.error || response.statusText}`)
      }

      setCustomResults((prev) => [
        ...prev.filter((r) => r.name !== queryName),
        {
          name: queryName,
          status: "success",
          duration,
          timestamp,
          data,
        },
      ])
    } catch (error) {
      const duration = Date.now() - startTime

      setCustomResults((prev) => [
        ...prev.filter((r) => r.name !== queryName),
        {
          name: queryName,
          status: "error",
          duration,
          timestamp,
          error: error instanceof Error ? error.message : "Unknown error",
          data: error,
        },
      ])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            PASS
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">FAIL</Badge>
      case "pending":
        return <Badge variant="secondary">Running...</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive system diagnostics and testing</p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning} size="lg">
          {isRunning ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Server className="mr-2 h-4 w-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {/* Critical Issue Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Issue Found:</strong> Your user role is "admin" but the Plans API requires "super_admin" access. You
          need to update your user role in the database to access plan management.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="cookies">Cookies</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Test Results
              </CardTitle>
              <CardDescription>
                Automated tests for authentication, API endpoints, and database connectivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No tests have been run yet. Click "Run All Tests" to start diagnostics.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.duration && `${result.duration}ms`} {result.timestamp}
                          </div>
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
                </div>
              )}
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
              <CardDescription>Execute SQL queries safely with admin authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={runCustomQuery} disabled={!sqlQuery.trim()}>
                  <Database className="mr-2 h-4 w-4" />
                  Execute Query
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSqlQuery("UPDATE users SET role = 'super_admin' WHERE email = 'bekace.multimedia@gmail.com';")
                  }
                >
                  Fix My Role
                </Button>
              </div>

              {customResults.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="font-medium">Query Results</h4>
                  {customResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                      {result.data && (
                        <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                      {result.error && <div className="text-sm text-red-600 mt-2">{result.error}</div>}
                    </div>
                  ))}
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
              <CardDescription>Current user session and authentication details</CardDescription>
            </CardHeader>
            <CardContent>
              {results.find((r) => r.name === "Session Debug") ? (
                <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                  {JSON.stringify(results.find((r) => r.name === "Session Debug")?.data, null, 2)}
                </pre>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Run tests to see session information</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Browser Cookies
              </CardTitle>
              <CardDescription>Current browser cookies and session data</CardDescription>
            </CardHeader>
            <CardContent>
              {results.find((r) => r.name === "Browser Cookies") ? (
                <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                  {JSON.stringify(results.find((r) => r.name === "Browser Cookies")?.data, null, 2)}
                </pre>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Run tests to see cookie information</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
