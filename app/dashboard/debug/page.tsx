"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Database, User, AlertCircle, CheckCircle } from "lucide-react"

interface DebugData {
  timestamp: string
  tables?: Record<string, any>
  errors?: string[]
  cookies?: Record<string, string>
  headers?: Record<string, string>
  user?: any
  sessionToken?: string | null
}

export default function DebugPage() {
  const [databaseDebug, setDatabaseDebug] = useState<DebugData | null>(null)
  const [sessionDebug, setSessionDebug] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [customQuery, setCustomQuery] = useState("")
  const [queryResult, setQueryResult] = useState<any>(null)

  const fetchDatabaseDebug = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/database")
      const data = await response.json()
      setDatabaseDebug(data.debug || data)
    } catch (error) {
      console.error("Failed to fetch database debug:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionDebug = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/session")
      const data = await response.json()
      setSessionDebug(data.debug || data)
    } catch (error) {
      console.error("Failed to fetch session debug:", error)
    } finally {
      setLoading(false)
    }
  }

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return

    try {
      setLoading(true)
      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: customQuery }),
      })
      const data = await response.json()
      setQueryResult(data)
    } catch (error) {
      console.error("Failed to execute query:", error)
      setQueryResult({ success: false, error: "Failed to execute query" })
    } finally {
      setLoading(false)
    }
  }

  const fixUserRole = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'",
        }),
      })
      const data = await response.json()
      setQueryResult(data)

      if (data.success) {
        await fetchSessionDebug()
      }
    } catch (error) {
      console.error("Failed to fix user role:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseDebug()
    fetchSessionDebug()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground">System diagnostics and troubleshooting</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchDatabaseDebug()
              fetchSessionDebug()
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh All
          </Button>
          <Button onClick={fixUserRole} disabled={loading}>
            Fix My Role
          </Button>
        </div>
      </div>

      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="query">Custom Query</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Status
              </CardTitle>
              <CardDescription>
                {databaseDebug?.timestamp && `Last updated: ${new Date(databaseDebug.timestamp).toLocaleString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {databaseDebug?.errors && databaseDebug.errors.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {databaseDebug.errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {databaseDebug?.tables && (
                <div className="grid gap-4">
                  {Object.entries(databaseDebug.tables).map(([tableName, tableInfo]) => (
                    <div key={tableName} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Badge variant={tableInfo.exists ? "default" : "destructive"}>
                          {tableInfo.exists ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {tableName}
                        </Badge>
                        {tableInfo.exists && (
                          <span className="text-sm text-muted-foreground">
                            {tableInfo.count || tableInfo.total_users || tableInfo.total_plans || 0} records
                          </span>
                        )}
                      </div>
                      {tableInfo.error && <span className="text-sm text-red-600">{tableInfo.error}</span>}
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
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Session Information
              </CardTitle>
              <CardDescription>
                {sessionDebug?.timestamp && `Last updated: ${new Date(sessionDebug.timestamp).toLocaleString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current User</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(sessionDebug?.user, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Session Token</h4>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  {sessionDebug?.sessionToken || "No session token"}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Cookies ({Object.keys(sessionDebug?.cookies || {}).length})</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(sessionDebug?.cookies, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Database Query</CardTitle>
              <CardDescription>Execute custom SQL queries for debugging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="SELECT * FROM users LIMIT 5;"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  rows={4}
                />
                <Button onClick={executeCustomQuery} disabled={loading || !customQuery.trim()}>
                  Execute Query
                </Button>
              </div>

              {queryResult && (
                <div>
                  <h4 className="font-medium mb-2">Query Result</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
