"use client"
import { useState, useEffect } from "react"
import { RefreshCw, Database, User, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useDashboard } from "@/components/dashboard/context/dashboard-context"

interface DebugResult {
  success: boolean
  data?: any
  error?: string
  timestamp: string
  duration: number
}

interface DatabaseTest {
  name: string
  query: string
  result: DebugResult | null
}

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [authTest, setAuthTest] = useState<DebugResult | null>(null)
  const [plansTest, setPlansTest] = useState<DebugResult | null>(null)
  const [databaseTests, setDatabaseTests] = useState<DatabaseTest[]>([
    { name: "Users Table", query: "SELECT COUNT(*) FROM users", result: null },
    { name: "Plans Table", query: "SELECT COUNT(*) FROM plans", result: null },
    { name: "Sessions Table", query: "SELECT COUNT(*) FROM user_sessions", result: null },
    { name: "Super Admin Check", query: "SELECT * FROM users WHERE role = 'super_admin'", result: null },
    { name: "Active Plans", query: "SELECT * FROM plans WHERE is_active = true", result: null },
  ])
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [cookieInfo, setCookieInfo] = useState<any>(null)

  const { user } = useDashboard()
  const { toast } = useToast()

  const runTest = async (url: string, method = "GET", body?: any): Promise<DebugResult> => {
    const startTime = Date.now()
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      return {
        success: response.ok,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: data,
        },
        error: response.ok ? undefined : `${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        duration,
      }
    }
  }

  const testAuthentication = async () => {
    console.log("Testing authentication...")
    const result = await runTest("/api/auth/me")
    setAuthTest(result)
    console.log("Auth test result:", result)
  }

  const testPlansAPI = async () => {
    console.log("Testing plans API...")
    const result = await runTest("/api/admin/plans")
    setPlansTest(result)
    console.log("Plans test result:", result)
  }

  const testDatabase = async () => {
    console.log("Testing database queries...")
    const updatedTests = await Promise.all(
      databaseTests.map(async (test) => {
        const result = await runTest("/api/debug/database", "POST", { query: test.query })
        return { ...test, result }
      }),
    )
    setDatabaseTests(updatedTests)
  }

  const getCookieInfo = () => {
    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [name, value] = cookie.trim().split("=")
        acc[name] = value
        return acc
      },
      {} as Record<string, string>,
    )
    setCookieInfo(cookies)
  }

  const getSessionInfo = async () => {
    try {
      const response = await fetch("/api/debug/session", {
        credentials: "include",
      })
      const data = await response.json()
      setSessionInfo(data)
    } catch (error) {
      setSessionInfo({ error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    try {
      getCookieInfo()
      await getSessionInfo()
      await testAuthentication()
      await testPlansAPI()
      await testDatabase()
      toast({
        title: "Debug Tests Complete",
        description: "All tests have been executed. Check the results below.",
      })
    } catch (error) {
      toast({
        title: "Debug Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCookieInfo()
    getSessionInfo()
  }, [])

  const renderResult = (result: DebugResult | null, title: string) => {
    if (!result) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Not tested yet</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {title}
            <Badge variant={result.success ? "default" : "destructive"}>{result.success ? "PASS" : "FAIL"}</Badge>
          </CardTitle>
          <CardDescription>
            Duration: {result.duration}ms | {result.timestamp}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Error: {result.error}</p>
            </div>
          )}
          <div className="space-y-2">
            <h4 className="font-medium">Response Data:</h4>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive system diagnostics and troubleshooting</p>
        </div>
        <Button onClick={runAllTests} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Run All Tests
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User ID:</strong> {user?.id || "Not available"}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || "Not available"}
            </div>
            <div>
              <strong>Role:</strong>{" "}
              <Badge variant={user?.role === "super_admin" ? "default" : "secondary"}>
                {user?.role || "Not available"}
              </Badge>
            </div>
            <div>
              <strong>Email Verified:</strong>{" "}
              <Badge variant={user?.is_email_verified ? "default" : "destructive"}>
                {user?.is_email_verified ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <strong>Plan:</strong> {user?.plan_name || "No plan"}
            </div>
            <div>
              <strong>Business:</strong> {user?.business_name || "Not set"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="database">Database Tests</TabsTrigger>
          <TabsTrigger value="session">Session Info</TabsTrigger>
          <TabsTrigger value="cookies">Cookies</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <div className="grid gap-4">
            {renderResult(authTest, "Authentication API (/api/auth/me)")}
            {renderResult(plansTest, "Plans API (/api/admin/plans)")}
          </div>
          <div className="flex gap-2">
            <Button onClick={testAuthentication} variant="outline" size="sm">
              Test Auth
            </Button>
            <Button onClick={testPlansAPI} variant="outline" size="sm">
              Test Plans
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid gap-4">
            {databaseTests.map((test, index) => (
              <Card
                key={index}
                className={test.result?.success ? "border-green-200" : test.result ? "border-red-200" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {test.name}
                    {test.result && (
                      <Badge variant={test.result.success ? "default" : "destructive"}>
                        {test.result.success ? "PASS" : "FAIL"}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">{test.query}</CardDescription>
                </CardHeader>
                <CardContent>
                  {test.result ? (
                    <div className="space-y-2">
                      {test.result.error && (
                        <div className="p-2 bg-red-100 border border-red-200 rounded text-red-800 text-sm">
                          {test.result.error}
                        </div>
                      )}
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                        {JSON.stringify(test.result.data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Not tested yet</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={testDatabase} variant="outline" size="sm">
            <Database className="mr-2 h-4 w-4" />
            Test Database
          </Button>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cookieInfo && Object.keys(cookieInfo).length > 0 ? (
                  Object.entries(cookieInfo).map(([name, value]) => (
                    <div key={name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm">{name}</span>
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-xs">{value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No cookies found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
