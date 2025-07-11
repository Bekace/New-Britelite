"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface DebugStep {
  name: string
  status: "pending" | "success" | "failed"
  result?: any
  error?: string
}

export default function MediaDebugPage() {
  const [steps, setSteps] = useState<DebugStep[]>([
    { name: "Check Authentication Status", status: "pending" },
    { name: "Test Session Cookie", status: "pending" },
    { name: "Verify Session Token", status: "pending" },
    { name: "Test Media API Access", status: "pending" },
    { name: "Check Database Connection", status: "pending" },
    { name: "Verify Media Table Structure", status: "pending" },
    { name: "Test File Upload Endpoint", status: "pending" },
    { name: "Check Vercel Blob Configuration", status: "pending" },
  ])
  const [running, setRunning] = useState(false)

  const updateStep = (index: number, status: "success" | "failed", result?: any, error?: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, status, result, error } : step)))
  }

  const runDebug = async () => {
    setRunning(true)

    try {
      // Step 1: Check Authentication Status
      try {
        const authResponse = await fetch("/api/auth/me")
        const authData = await authResponse.json()

        if (authResponse.ok) {
          updateStep(0, "success", {
            authenticated: true,
            user: authData.user,
            sessionExists: true,
          })
        } else {
          updateStep(
            0,
            "failed",
            {
              authenticated: false,
              error: authData.error,
            },
            `Authentication failed: ${authData.error}`,
          )
        }
      } catch (error) {
        updateStep(0, "failed", null, `Auth check failed: ${error}`)
      }

      // Step 2: Test Session Cookie
      try {
        const cookies = document.cookie.split(";").reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split("=")
            acc[key] = value
            return acc
          },
          {} as Record<string, string>,
        )

        const sessionCookies = Object.keys(cookies).filter(
          (key) => key.includes("session") || key.includes("token") || key.includes("auth"),
        )

        updateStep(1, "success", {
          allCookies: Object.keys(cookies),
          sessionCookies,
          cookieCount: Object.keys(cookies).length,
        })
      } catch (error) {
        updateStep(1, "failed", null, `Cookie check failed: ${error}`)
      }

      // Step 3: Verify Session Token
      try {
        const sessionResponse = await fetch("/api/debug/session")
        const sessionData = await sessionResponse.json()

        if (sessionResponse.ok) {
          updateStep(2, "success", sessionData)
        } else {
          updateStep(2, "failed", sessionData, `Session verification failed: ${sessionData.error}`)
        }
      } catch (error) {
        updateStep(2, "failed", null, `Session verification error: ${error}`)
      }

      // Step 4: Test Media API Access
      try {
        const mediaResponse = await fetch("/api/media")
        const mediaData = await mediaResponse.json()

        if (mediaResponse.ok) {
          updateStep(3, "success", {
            filesCount: Array.isArray(mediaData.files) ? mediaData.files.length : 0,
            response: mediaData,
          })
        } else {
          updateStep(3, "failed", mediaData, `Media API failed: ${mediaData.error}`)
        }
      } catch (error) {
        updateStep(3, "failed", null, `Media API error: ${error}`)
      }

      // Step 5: Check Database Connection
      try {
        const dbResponse = await fetch("/api/debug/database")
        const dbData = await dbResponse.json()

        if (dbResponse.ok) {
          updateStep(4, "success", dbData)
        } else {
          updateStep(4, "failed", dbData, `Database check failed: ${dbData.error}`)
        }
      } catch (error) {
        updateStep(4, "failed", null, `Database error: ${error}`)
      }

      // Step 6: Verify Media Table Structure
      try {
        const tableResponse = await fetch("/api/debug/media-table")
        const tableData = await tableResponse.json()

        if (tableResponse.ok) {
          updateStep(5, "success", tableData)
        } else {
          updateStep(5, "failed", tableData, `Media table check failed: ${tableData.error}`)
        }
      } catch (error) {
        updateStep(5, "failed", null, `Media table error: ${error}`)
      }

      // Step 7: Test File Upload Endpoint
      try {
        // Create a small test file
        const testFile = new File(["test content"], "test.txt", { type: "text/plain" })
        const formData = new FormData()
        formData.append("file", testFile)

        const uploadResponse = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })
        const uploadData = await uploadResponse.json()

        if (uploadResponse.ok) {
          updateStep(6, "success", uploadData)
        } else {
          updateStep(6, "failed", uploadData, `Upload test failed: ${uploadData.error}`)
        }
      } catch (error) {
        updateStep(6, "failed", null, `Upload test error: ${error}`)
      }

      // Step 8: Check Vercel Blob Configuration
      try {
        const blobResponse = await fetch("/api/debug/blob-config")
        const blobData = await blobResponse.json()

        if (blobResponse.ok) {
          updateStep(7, "success", blobData)
        } else {
          updateStep(7, "failed", blobData, `Blob config check failed: ${blobData.error}`)
        }
      } catch (error) {
        updateStep(7, "failed", null, `Blob config error: ${error}`)
      }
    } finally {
      setRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Upload Debug</h1>
          <p className="text-muted-foreground">Comprehensive debugging for media upload authentication issues</p>
        </div>
        <Button onClick={runDebug} disabled={running}>
          {running ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Debug...
            </>
          ) : (
            "Run Debug Tests"
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Steps</CardTitle>
          <CardDescription>Each step tests a different part of the media upload authentication flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(step.status)}
                  <span className="font-medium">
                    Step {index + 1}: {step.name}
                  </span>
                </div>
                {getStatusBadge(step.status)}
              </div>

              {step.status === "success" && step.result && (
                <div className="ml-8 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Success Result:</h4>
                  <pre className="text-sm text-green-700 overflow-x-auto">{JSON.stringify(step.result, null, 2)}</pre>
                </div>
              )}

              {step.status === "failed" && (
                <div className="ml-8 space-y-2">
                  {step.error && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">Error:</h4>
                      <p className="text-sm text-red-700">{step.error}</p>
                    </div>
                  )}
                  {step.result && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                      <pre className="text-sm text-red-700 overflow-x-auto">{JSON.stringify(step.result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              {index < steps.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Session Cookie Issues</h4>
            <p className="text-sm text-muted-foreground">
              - Check if session cookie name matches between login and API routes - Verify cookie is being set with
              correct domain and path - Ensure cookie is not being blocked by browser settings
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Authentication Flow Problems</h4>
            <p className="text-sm text-muted-foreground">
              - Verify getUserFromSession function is using correct cookie name - Check if session is being properly
              validated in database - Ensure session hasn't expired
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Database Connection Issues</h4>
            <p className="text-sm text-muted-foreground">
              - Verify database connection is working - Check if sessions table exists and has correct structure -
              Ensure user permissions are correct
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">4. API Route Configuration</h4>
            <p className="text-sm text-muted-foreground">
              - Check if API routes are properly configured - Verify middleware is not interfering with requests -
              Ensure CORS settings allow the requests
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
