import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("Database Debug API: POST request received")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    console.log("Database Debug API: User check:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
    })

    if (!user) {
      console.log("Database Debug API: No authenticated user")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      console.log("Database Debug API: Insufficient permissions")
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    console.log("Database Debug API: Executing query:", query.substring(0, 100) + "...")

    // Execute the query
    const startTime = Date.now()
    const result = await sql(query)
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
