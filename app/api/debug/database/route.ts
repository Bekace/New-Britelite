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

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      console.log("Database Debug API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    // Security check - only allow SELECT statements and basic operations
    const trimmedQuery = query.trim().toLowerCase()
    if (
      !trimmedQuery.startsWith("select") &&
      !trimmedQuery.startsWith("show") &&
      !trimmedQuery.startsWith("describe")
    ) {
      return NextResponse.json(
        { success: false, error: "Only SELECT, SHOW, and DESCRIBE queries are allowed" },
        { status: 400 },
      )
    }

    console.log("Database Debug API: Executing query:", query)

    const result = await sql.unsafe(query)

    console.log("Database Debug API: Query executed successfully, rows:", result.length)

    return NextResponse.json({
      success: true,
      data: {
        rows: result,
        count: result.length,
        sql: query,
      },
      query,
      executedAt: new Date().toISOString(),
      executedBy: user.email,
    })
  } catch (error) {
    console.error("Database Debug API: Error:", error)
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
