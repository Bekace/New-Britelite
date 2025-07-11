"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface DebugStep {
  id: string
  name: string
  status: "pending" | "success" | "failed" | "running"
  result?: any
  error?: string
}

export default function PlansDebugPage() {
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([
    { id: "connection", name: "Database Connection Test", status: "pending" },
    { id: "table-exists", name: "Plans Table Existence Check", status: "pending" },
    { id: "all-tables", name: "List All Database Tables", status: "pending" },
    { id: "table-structure", name: "Plans Table Structure", status: "pending" },
    { id: "total-count", name: "Total Plans Count", status: "pending" },
    { id: "active-count", name: "Active Plans Count", status: "pending" },
    { id: "sample-data", name: "Sample Plans Data", status: "pending" },
    { id: "api-query", name: "API Query Test", status: "pending" },
    { id: "features-table", name: "Plan Features Table Check", status: "pending" },
    { id: "assignments-table", name: "Plan Feature Assignments Table Check", status: "pending" },
    { id: "complex-query", name: "Complex Query with Features Test", status: "pending" },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [debugStartTime, setDebugStartTime] = useState<Date | null>(null)

  const updateStep = (id: string, updates: Partial<DebugStep>) => {
    setDebugSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...updates } : step)))
  }

  const runDebug = async () => {
    setIsRunning(true)
    setDebugStartTime(new Date())

    // Reset all steps
    setDebugSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as const, result: undefined, error: undefined })),
    )

    try {
      const response = await fetch("/api/debug/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.step) {
                updateStep(data.step, {
                  status: data.status,
                  result: data.result,
                  error: data.error,
                })
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Debug failed:", error)
      // Mark all pending steps as failed
      setDebugSteps((prev) =>
        prev.map((step) =>
          step.status === "pending" || step.status === "running"
            ? { ...step, status: "failed", error: error instanceof Error ? error.message : "Unknown error" }
            : step,
        ),
      )
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: DebugStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "running":
        return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusBadge = (status: DebugStep["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Plans Debug</h1>
        <p className="text-muted-foreground">Detailed breakdown of each plans loading step</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Controls</CardTitle>
          <CardDescription>Run comprehensive plans debugging to identify loading issues</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runDebug} disabled={isRunning} className="w-full">
            {isRunning ? "Running Debug..." : "Run Plans Debug"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {debugSteps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(step.status)}
                  <div>
                    <CardTitle className="text-lg">
                      Step {index + 1}: {step.name}
                    </CardTitle>
                  </div>
                </div>
                {getStatusBadge(step.status)}
              </div>
            </CardHeader>

            {(step.result || step.error) && (
              <CardContent className="pt-0">
                <Separator className="mb-4" />

                {step.status === "success" && step.result && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-700">Result:</h4>
                    <pre className="bg-green-50 p-3 rounded-md text-sm overflow-x-auto border border-green-200">
                      {typeof step.result === "string" ? step.result : JSON.stringify(step.result, null, 2)}
                    </pre>
                  </div>
                )}

                {step.status === "failed" && step.error && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-700">Error:</h4>
                    <pre className="bg-red-50 p-3 rounded-md text-sm overflow-x-auto border border-red-200">
                      {step.error}
                    </pre>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                        View Stack Trace
                      </summary>
                      <pre className="bg-red-50 p-3 rounded-md text-xs overflow-x-auto border border-red-200 mt-2">
                        {step.error}
                      </pre>
                    </details>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {debugStartTime && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Debug completed at: {debugStartTime.toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use This Debug Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
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
