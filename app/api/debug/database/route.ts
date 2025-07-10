import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("Database Debug API: POST request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("Database Debug API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Database Debug API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
    })

    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      console.log("Database Debug API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    console.log("Database Debug API: Executing query:", query)

    // Execute the query
    const result = await sql.unsafe(query)

    console.log("Database Debug API: Query executed successfully, rows:", result.length)

    return NextResponse.json({
      success: true,
      data: {
        query: query,
        rowCount: result.length,
        results: result,
        executedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Database Debug API: Error executing query:", error)
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
