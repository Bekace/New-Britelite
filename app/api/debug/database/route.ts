import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      database: {
        connected: true,
        queries: [],
      },
    }

    // Test basic queries
    try {
      const usersCount = await executeQuery("SELECT COUNT(*) as count FROM users")
      debugInfo.database.queries.push({
        query: "SELECT COUNT(*) as count FROM users",
        result: usersCount,
        success: true,
      })
    } catch (error) {
      debugInfo.database.queries.push({
        query: "SELECT COUNT(*) as count FROM users",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      })
    }

    try {
      const plansCount = await executeQuery("SELECT COUNT(*) as count FROM plans")
      debugInfo.database.queries.push({
        query: "SELECT COUNT(*) as count FROM plans",
        result: plansCount,
        success: true,
      })
    } catch (error) {
      debugInfo.database.queries.push({
        query: "SELECT COUNT(*) as count FROM plans",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      })
    }

    try {
      const sessionsCount = await executeQuery("SELECT COUNT(*) as count FROM sessions")
      debugInfo.database.queries.push({
        query: "SELECT COUNT(*) as count FROM sessions",
        result: sessionsCount,
        success: true,
      })
    } catch (error) {
      debugInfo.database.queries.push({
        query: "SELECT COUNT(*) as count FROM sessions",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      })
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { query, params = [] } = await request.json()

    if (!query) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    // Only allow safe queries (SELECT, UPDATE for specific operations)
    const safeQuery = query.trim().toLowerCase()
    if (!safeQuery.startsWith("select") && !safeQuery.startsWith("update users set role")) {
      return NextResponse.json(
        { success: false, error: "Only SELECT queries and role updates are allowed" },
        { status: 400 },
      )
    }

    const result = await executeQuery(query, params)

    return NextResponse.json({
      success: true,
      result: result,
      query: query,
      params: params,
    })
  } catch (error) {
    console.error("Database query error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
