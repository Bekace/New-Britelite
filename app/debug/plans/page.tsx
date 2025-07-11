"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, Database, Package, Settings } from "lucide-react"

interface DebugResult {
  timestamp: string
  steps: Array<{
    step: number
    name: string
    status: "success" | "failed"
    result?: any
    error?: string
    stack?: string
  }>
  environment: {
    hasJwtSecret: boolean
    hasDatabaseUrl: boolean
    nodeEnv: string
  }
}

export default function PlansDebugPage() {
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebug = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      console.error("Debug failed:", error)
      setDebugResult({
        timestamp: new Date().toISOString(),
        steps: [
          {
            step: 1,
            name: "Debug Request",
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
        environment: {
          hasJwtSecret: false,
          hasDatabaseUrl: false,
          nodeEnv: "unknown",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: "success" | "failed") => {
    return status === "success" ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusColor = (status: "success" | "failed") => {
    return status === "success" ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plans Debug Tool</h1>
          <p className="text-gray-600">Debug why plans are not showing up in the application</p>
        </div>

        {/* Debug Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Debug Controls
            </CardTitle>
            <CardDescription>Run comprehensive plans debugging to identify issues</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runDebug} disabled={isLoading} className="w-full">
              {isLoading ? "Running Debug..." : "Run Plans Debug"}
            </Button>
          </CardContent>
        </Card>

        {/* Debug Results */}
        {debugResult && (
          <div className="space-y-6">
            {/* Environment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Environment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">JWT Secret</span>
                    <Badge variant={debugResult.environment.hasJwtSecret ? "default" : "destructive"}>
                      {debugResult.environment.hasJwtSecret ? "Present" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Database URL</span>
                    <Badge variant={debugResult.environment.hasDatabaseUrl ? "default" : "destructive"}>
                      {debugResult.environment.hasDatabaseUrl ? "Present" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Environment</span>
                    <Badge variant="outline">{debugResult.environment.nodeEnv}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debug Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Plans Debug Steps
                </CardTitle>
                <CardDescription>Detailed breakdown of each plans loading step</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {debugResult.steps.map((step, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(step.status)}
                        <div>
                          <h3 className="font-semibold">
                            Step {step.step}: {step.name}
                          </h3>
                        </div>
                      </div>
                      <Badge className={getStatusColor(step.status)}>{step.status}</Badge>
                    </div>

                    {step.result && (
                      <div className="ml-8">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-2">Result:</h4>
                          <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-x-auto">
                            {typeof step.result === "string" ? step.result : JSON.stringify(step.result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {step.error && (
                      <div className="ml-8">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div>
                                <strong>Error:</strong> {step.error}
                              </div>
                              {step.stack && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-sm font-medium">View Stack Trace</summary>
                                  <pre className="mt-2 text-xs bg-red-50 p-2 rounded border overflow-x-auto">
                                    {step.stack}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {index < debugResult.steps.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-500">
              Debug completed at: {new Date(debugResult.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. Click "Run Plans Debug" to test all plans loading steps</p>
            <p>2. Review each step to identify where the failure occurs</p>
            <p>3. Check database connectivity, table names, and query structure</p>
            <p>4. Look for specific error messages that indicate the root cause</p>
            <p>5. Use the results to fix the exact issue causing plans not to load</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
