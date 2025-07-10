import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug database API called")

    const results = {
      timestamp: new Date().toISOString(),
      tables: {} as Record<string, any>,
      errors: [] as string[],
    }

    // Check tables exist
    const tables = ["users", "sessions", "plans", "features", "audit_logs"]

    for (const table of tables) {
      try {
        const result = await sql`
          SELECT COUNT(*) as count, 
                 (SELECT column_name FROM information_schema.columns 
                  WHERE table_name = ${table} 
                  ORDER BY ordinal_position) as sample_column
          FROM ${sql(table)}
        `
        results.tables[table] = {
          exists: true,
          count: result[0]?.count || 0,
          sample_column: result[0]?.sample_column,
        }
      } catch (error) {
        results.tables[table] = {
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
        results.errors.push(`Table ${table}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    // Test basic queries
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      results.tables.users.total_users = userCount[0]?.count || 0
    } catch (error) {
      results.errors.push(`User count query failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    try {
      const planCount = await sql`SELECT COUNT(*) as count FROM plans`
      results.tables.plans.total_plans = planCount[0]?.count || 0
    } catch (error) {
      results.errors.push(`Plan count query failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    return NextResponse.json({
      success: true,
      debug: results,
    })
  } catch (error) {
    console.error("Debug database error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, params = [] } = await request.json()

    if (!query) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    console.log("Executing debug query:", query)
    console.log("With params:", params)

    const result = await sql.unsafe(query, params)

    return NextResponse.json({
      success: true,
      result: result,
      rowCount: result.length,
    })
  } catch (error) {
    console.error("Debug query error:", error)
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
