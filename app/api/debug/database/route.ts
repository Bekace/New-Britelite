import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("Database Debug API: POST request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Database Debug API: Session token exists:", !!sessionToken)

    if (!sessionToken) {
      console.log("Database Debug API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Database Debug API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
    })

    if (!user) {
      console.log("Database Debug API: Session verification failed")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      console.log("Database Debug API: Access denied for role:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    // Security check - only allow safe operations
    const trimmedQuery = query.trim().toLowerCase()
    const allowedOperations = ["select", "show", "describe", "update users set role"]
    const isAllowed = allowedOperations.some((op) => trimmedQuery.startsWith(op))

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: "Only SELECT, SHOW, DESCRIBE, and role UPDATE queries are allowed" },
        { status: 400 },
      )
    }

    console.log("Database Debug API: Executing query:", query.substring(0, 100) + "...")

    const startTime = Date.now()
    const result = await sql.unsafe(query)
    const executionTime = Date.now() - startTime

    console.log("Database Debug API: Query executed successfully in", executionTime, "ms")

    return NextResponse.json({
      success: true,
      data: {
        rows: result,
        sql: query,
      },
      query,
      executedAt: new Date().toISOString(),
      executedBy: user.email,
      executionTime,
    })
  } catch (error) {
    console.error("Database Debug API: Error executing query:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Query execution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
