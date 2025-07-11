"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, Search, Settings } from "lucide-react"

interface DebugStep {
  id: string
  name: string
  status: "pending" | "running" | "success" | "failed"
  result?: any
  error?: string
}

export default function PlansDebugPage() {
  const [steps, setSteps] = useState<DebugStep[]>([
    { id: "connection", name: "Database Connection Test", status: "pending" },
    { id: "table-exists", name: "Plans Table Existence Check", status: "pending" },
    { id: "all-tables", name: "List All Database Tables", status: "pending" },
    { id: "table-structure", name: "Plans Table Structure", status: "pending" },
    { id: "total-count", name: "Total Plans Count", status: "pending" },
    { id: "active-count", name: "Active Plans Count", status: "pending" },
    { id: "sample-data", name: "Sample Plans Data", status: "pending" },
    { id: "api-query", name: "API Query Test", status: "pending" },
    { id: "plan-features", name: "Plan Features Table Check", status: "pending" },
    { id: "plan-assignments", name: "Plan Feature Assignments Table Check", status: "pending" },
    { id: "complex-query", name: "Complex Query with Features Test", status: "pending" },
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [debugStartTime, setDebugStartTime] = useState<string>("")

  const updateStep = (id: string, updates: Partial<DebugStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...updates } : step)))
  }

  const runDebug = async () => {
    setIsRunning(true)
    setDebugStartTime(new Date().toLocaleString())

    // Reset all steps
    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending", result: undefined, error: undefined })))

    try {
      const response = await fetch("/api/debug/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_all_tests" }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.results) {
        // Update each step with results
        Object.entries(data.results).forEach(([stepId, result]: [string, any]) => {
          if (result.success) {
            updateStep(stepId, {
              status: "success",
              result: result.data,
            })
          } else {
            updateStep(stepId, {
              status: "failed",
              error: result.error,
            })
          }
        })
      } else {
        console.error("Debug API returned error:", data)
      }
    } catch (error) {
      console.error("Debug request failed:", error)
      // Mark all steps as failed
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: "failed",
          error: "Debug request failed",
        })),
      )
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            success
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">failed</Badge>
      case "running":
        return <Badge variant="secondary">running</Badge>
      default:
        return <Badge variant="outline">pending</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans Debug Tool</h1>
          <p className="text-gray-600">Diagnose issues with plans loading and database queries</p>
        </div>
        <Button onClick={runDebug} disabled={isRunning} size="lg">
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Running Debug...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Run Plans Debug
            </>
          )}
        </Button>
      </div>

      {/* Debug Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Plans Debug Steps
          </CardTitle>
          <CardDescription>Detailed breakdown of each plans loading step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">Step {index + 1}:</span>
                  {getStatusIcon(step.status)}
                  <h3 className="font-medium">{step.name}</h3>
                </div>
                {getStatusBadge(step.status)}
              </div>

              {step.status === "success" && step.result && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Result:</p>
                  <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto border border-green-200">
                    {JSON.stringify(step.result, null, 2)}
                  </pre>
                </div>
              )}

              {step.status === "failed" && step.error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {step.error}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm underline">View Stack Trace</summary>
                      <pre className="mt-2 text-xs bg-red-50 p-2 rounded border overflow-x-auto">{step.error}</pre>
                    </details>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Debug Info */}
      {debugStartTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              <strong>Debug completed at:</strong> {debugStartTime}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Debug Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Click "Run Plans Debug" to test all plans loading steps</li>
            <li>Review each step to identify where the failure occurs</li>
            <li>Check database connectivity, table names, and query structure</li>
            <li>Look for specific error messages that indicate the root cause</li>
            <li>Use the results to fix the exact issue causing plans not to load</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
