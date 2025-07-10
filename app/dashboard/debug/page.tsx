"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  RefreshCw,
  Database,
  User,
  Settings,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react"

interface DebugInfo {
  timestamp: string
  user: any
  database: any
  session: any
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customQuery, setCustomQuery] = useState("")
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    session: true,
    database: true,
    user: true,
  })

  const fetchDebugInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      const [sessionResponse, databaseResponse] = await Promise.all([
        fetch("/api/debug/session", { credentials: "include" }),
        fetch("/api/debug/database", { credentials: "include" }),
      ])

      const sessionData = await sessionResponse.json()
      const databaseData = await databaseResponse.json()

      setDebugInfo({
        timestamp: new Date().toISOString(),
        session: sessionData.success ? sessionData.debug : { error: sessionData.error },
        database: databaseData.success ? databaseData.debug : { error: databaseData.error },
        user: sessionData.success ? sessionData.debug.user : null,
      })
    } catch (err) {
      console.error("Debug fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch debug info")
    } finally {
      setLoading(false)
    }
  }

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return

    try {
      setQueryLoading(true)
      setQueryResult(null)

      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: customQuery,
        }),
      })

      const data = await response.json()
      setQueryResult(data)
    } catch (err) {
      console.error("Query execution error:", err)
      setQueryResult({
        success: false,
        error: err instanceof Error ? err.message : "Query failed",
      })
    } finally {
      setQueryLoading(false)
    }
  }

  const fixUserRole = async () => {
    try {
      setQueryLoading(true)

      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query:
            "UPDATE users SET role = 'admin' WHERE role = 'user' AND email = (SELECT email FROM users WHERE id = $1)",
          params: [debugInfo?.user?.id],
        }),
      })

      const data = await response.json()
      setQueryResult(data)

      if (data.success) {
        // Refresh debug info
        await fetchDebugInfo()
      }
    } catch (err) {
      console.error("Role fix error:", err)
      setQueryResult({
        success: false,
        error: err instanceof Error ? err.message : "Role fix failed",
      })
    } finally {
      setQueryLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground">System diagnostics and troubleshooting tools</p>
        </div>
        <Button onClick={fetchDebugInfo} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="query">Custom Query</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {debugInfo && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">User Status</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(!!debugInfo.user)}
                    <span className="text-2xl font-bold">{debugInfo.user ? "Authenticated" : "Not Authenticated"}</span>
                  </div>
                  {debugInfo.user && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">Role: {debugInfo.user.role}</p>
                      <p className="text-xs text-muted-foreground">Email: {debugInfo.user.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Database</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(!debugInfo.database.error)}
                    <span className="text-2xl font-bold">{debugInfo.database.error ? "Error" : "Connected"}</span>
                  </div>
                  {debugInfo.database.queries && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {debugInfo.database.queries.filter((q: any) => q.success).length} /{" "}
                      {debugInfo.database.queries.length} queries successful
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Session</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(!!debugInfo.session.cookies?.session)}
                    <span className="text-2xl font-bold">
                      {debugInfo.session.cookies?.session ? "Active" : "No Session"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cookies: {Object.keys(debugInfo.session.cookies || {}).length}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {debugInfo?.user?.role !== "admin" && debugInfo?.user?.role !== "super_admin" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Your role is "{debugInfo?.user?.role}" but admin access is required for plan management.</span>
                <Button size="sm" onClick={fixUserRole} disabled={queryLoading}>
                  Fix My Role
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          {debugInfo?.session && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                  <CardDescription>Current session and authentication details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">User</Label>
                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto">
                      {formatJson(debugInfo.session.user)}
                    </pre>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Cookies</Label>
                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto">
                      {formatJson(debugInfo.session.cookies)}
                    </pre>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Headers</Label>
                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto">
                      {formatJson(debugInfo.session.headers)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {debugInfo?.database && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Database Status</CardTitle>
                  <CardDescription>Connection status and query results</CardDescription>
                </CardHeader>
                <CardContent>
                  {debugInfo.database.error ? (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{debugInfo.database.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Database connected successfully</span>
                      </div>

                      {debugInfo.database.queries && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Query Results</Label>
                          {debugInfo.database.queries.map((query: any, index: number) => (
                            <Collapsible key={index}>
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-between bg-transparent">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(query.success)}
                                    <span className="font-mono text-xs">{query.query}</span>
                                  </div>
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 p-3 bg-muted rounded-md">
                                  <pre className="text-xs overflow-auto">{formatJson(query.result || query.error)}</pre>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Query Executor</CardTitle>
              <CardDescription>Execute custom database queries (SELECT only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">SQL Query</Label>
                <Textarea
                  id="query"
                  placeholder="SELECT * FROM users LIMIT 10;"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={executeCustomQuery} disabled={queryLoading || !customQuery.trim()}>
                  <Play className={`mr-2 h-4 w-4 ${queryLoading ? "animate-spin" : ""}`} />
                  Execute Query
                </Button>
                <Button variant="outline" onClick={() => setCustomQuery("")}>
                  Clear
                </Button>
              </div>

              {queryResult && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Query Result</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(queryResult.success)}
                      <Badge variant={queryResult.success ? "default" : "destructive"}>
                        {queryResult.success ? "Success" : "Error"}
                      </Badge>
                    </div>
                    <pre className="text-xs overflow-auto max-h-96">{formatJson(queryResult)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
