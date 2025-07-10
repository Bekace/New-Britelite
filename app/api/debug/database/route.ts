import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("Debug Database API: POST request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Debug Database API: Session token exists:", !!sessionToken)

    if (!sessionToken) {
      console.log("Debug Database API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Debug Database API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
      userEmail: user?.email,
    })

    if (!user) {
      console.log("Debug Database API: Session verification failed")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      console.log("Debug Database API: Access denied for role:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    console.log("Debug Database API: Executing query:", query.substring(0, 100) + "...")

    // Execute the query
    const result = await sql.unsafe(query)

    console.log("Debug Database API: Query executed successfully, rows:", result.length)

    return NextResponse.json({
      success: true,
      data: {
        rows: result,
        sql: query,
      },
      query: query,
      executedAt: new Date().toISOString(),
      executedBy: user.email,
    })
  } catch (error) {
    console.error("Debug Database API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
