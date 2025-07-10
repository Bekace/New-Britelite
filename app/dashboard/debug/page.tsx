"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Database, User, Cookie, Server } from "lucide-react"
import { useDashboard } from "@/components/dashboard/context/dashboard-context"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  data?: any
  duration?: number
  timestamp?: string
}

interface DebugData {
  user: any
  session: any
  cookies: any
  database: any
  apis: TestResult[]
}

export default function DebugPage() {
  const [debugData, setDebugData] = useState<DebugData>({
    user: null,
    session: null,
    cookies: null,
    database: null,
    apis: [],
  })
  const [loading, setLoading] = useState(false)
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users WHERE role = 'super_admin' LIMIT 5;")
  const [sqlResult, setSqlResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [mounted, setMounted] = useState(false)

  const { user } = useDashboard()

  useEffect(() => {
    setMounted(true)
  }, [])

  const runTest = async (name: string, testFn: () => Promise<any>): Promise<TestResult> => {
    const startTime = Date.now()
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      return {
        name,
        status: "success",
        message: "Test passed",
        data: result,
        duration,
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      return {
        name,
        status: "error",
        message: error.message || "Test failed",
        data: error,
        duration,
        timestamp: new Date().toISOString(),
      }
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    const tests: TestResult[] = []

    // Test 1: Current User Info
    tests.push(
      await runTest("Current User Context", async () => {
        return {
          contextUser: user,
          hasUser: !!user,
          userRole: user?.role,
          userId: user?.id,
        }
      }),
    )

    // Test 2: Session API
    tests.push(
      await runTest("Session API (/api/auth/me)", async () => {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(`${response.status}: ${data.error || response.statusText}`)
        }
        return { status: response.status, data }
      }),
    )

    // Test 3: Debug Session API
    tests.push(
      await runTest("Debug Session API (/api/debug/session)", async () => {
        const response = await fetch("/api/debug/session", {
          credentials: "include",
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(`${response.status}: ${data.error || response.statusText}`)
        }
        return { status: response.status, data }
      }),
    )

    // Test 4: Plans API
    tests.push(
      await runTest("Plans API (/api/admin/plans)", async () => {
        const response = await fetch("/api/admin/plans", {
          credentials: "include",
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(`${response.status}: ${data.error || response.statusText}`)
        }
        return { status: response.status, data }
      }),
    )

    // Test 5: Database Connection
    tests.push(
      await runTest("Database Connection", async () => {
        const response = await fetch("/api/debug/database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ query: "SELECT COUNT(*) as count FROM users;" }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(`${response.status}: ${data.error || response.statusText}`)
        }
        return { status: response.status, data }
      }),
    )

    // Test 6: Super Admin Check
    tests.push(
      await runTest("Super Admin Users", async () => {
        const response = await fetch("/api/debug/database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ query: "SELECT id, email, role FROM users WHERE role = 'super_admin';" }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(`${response.status}: ${data.error || response.statusText}`)
        }
        return { status: response.status, data }
      }),
    )

    // Test 7: Cookie Check (only on client side)
    if (mounted && typeof window !== "undefined") {
      tests.push(
        await runTest("Browser Cookies", async () => {
          const cookies = document.cookie.split(";").reduce((acc: any, cookie) => {
            const [key, value] = cookie.trim().split("=")
            if (key) acc[key] = value
            return acc
          }, {})
          return {
            allCookies: cookies,
            hasSession: !!cookies.session,
            sessionValue: cookies.session ? cookies.session.substring(0, 20) + "..." : null,
          }
        }),
      )
    }

    setDebugData((prev) => ({ ...prev, apis: tests }))
    setLoading(false)
  }

  const executeSqlQuery = async () => {
    if (!sqlQuery.trim()) return

    try {
      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: sqlQuery }),
      })
      const data = await response.json()
      setSqlResult(data)
    } catch (error: any) {
      setSqlResult({ success: false, error: error.message })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getCookieValue = (name: string) => {
    if (!mounted || typeof window === "undefined") return "Loading..."
    const cookies = document.cookie.split(";")
    const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`))
    return cookie ? cookie.split("=")[1] : "Not found"
  }

  const getCookieCount = () => {
    if (!mounted || typeof window === "undefined") return 0
    return document.cookie.split(";").filter((c) => c.trim()).length
  }

  const getAllCookies = () => {
    if (!mounted || typeof window === "undefined") return "Loading..."
    return document.cookie || "No cookies found"
  }

  useEffect(() => {
    if (mounted) {
      runAllTests()
    }
  }, [mounted])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Debug Dashboard</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive system diagnostics and debugging tools</p>
        </div>
        <Button onClick={runAllTests} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Running Tests..." : "Run All Tests"}
        </Button>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>User ID:</strong>
              <div className="font-mono">{user?.id || "null"}</div>
            </div>
            <div>
              <strong>Email:</strong>
              <div className="font-mono">{user?.email || "null"}</div>
            </div>
            <div>
              <strong>Role:</strong>
              <Badge variant={user?.role === "super_admin" ? "default" : "secondary"}>{user?.role || "null"}</Badge>
            </div>
            <div>
              <strong>Verified:</strong>
              <Badge variant={user?.is_email_verified ? "default" : "destructive"}>
                {user?.is_email_verified ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Debug Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Server className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="session">
            <User className="mr-2 h-4 w-4" />
            Session
          </TabsTrigger>
          <TabsTrigger value="cookies">
            <Cookie className="mr-2 h-4 w-4" />
            Cookies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {debugData.apis.map((test, index) => (
              <Card key={index} className={getStatusColor(test.status)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      {test.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {test.duration && <span>{test.duration}ms</span>}
                      {test.timestamp && <span>{new Date(test.timestamp).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{test.message}</p>
                    {test.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium">View Details</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL Query Executor</CardTitle>
              <CardDescription>Execute SQL queries safely (admin only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>
              <Button onClick={executeSqlQuery} disabled={!sqlQuery.trim()}>
                Execute Query
              </Button>
              {sqlResult && (
                <div className="space-y-2">
                  <Label>Query Result</Label>
                  <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(sqlResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Database Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSqlQuery("SELECT * FROM users WHERE role = 'super_admin';")}
                >
                  Check Super Admins
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSqlQuery("SELECT * FROM plans ORDER BY created_at DESC LIMIT 10;")}
                >
                  Check Plans
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSqlQuery("SELECT * FROM user_sessions WHERE expires_at > NOW() LIMIT 10;")}
                >
                  Active Sessions
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSqlQuery("SHOW TABLES;")}>
                  Show Tables
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Context User</Label>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <Label>Session Data</Label>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(debugData.session, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>All Cookies</Label>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{getAllCookies()}</pre>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Session Cookie</Label>
                    <Input value={getCookieValue("session")} readOnly className="font-mono text-xs" />
                  </div>
                  <div>
                    <Label>Cookie Count</Label>
                    <Input value={getCookieCount()} readOnly className="font-mono" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
