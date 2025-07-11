import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const debugResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[],
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length,
        nodeEnv: process.env.NODE_ENV,
      },
    }

    // Test 1: Basic connection
    try {
      debugResults.tests.push({
        test: "Basic Connection",
        status: "testing",
      })

      const result = await sql`SELECT 1 as test`
      debugResults.tests[0].status = "success"
      debugResults.tests[0].result = result[0]
    } catch (error) {
      debugResults.tests[0].status = "failed"
      debugResults.tests[0].error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test 2: Check tables exist
    try {
      debugResults.tests.push({
        test: "Table Structure Check",
        status: "testing",
      })

      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'user_sessions', 'plans', 'audit_logs')
        ORDER BY table_name
      `

      debugResults.tests[1].status = "success"
      debugResults.tests[1].result = {
        tablesFound: tables.map((t: any) => t.table_name),
        expectedTables: ["users", "user_sessions", "plans", "audit_logs"],
      }
    } catch (error) {
      debugResults.tests[1].status = "failed"
      debugResults.tests[1].error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test 3: Check users table structure
    try {
      debugResults.tests.push({
        test: "Users Table Structure",
        status: "testing",
      })

      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `

      debugResults.tests[2].status = "success"
      debugResults.tests[2].result = {
        columns: columns,
        hasIsActiveColumn: columns.some((c: any) => c.column_name === "is_active"),
        hasPasswordHashColumn: columns.some((c: any) => c.column_name === "password_hash"),
        hasEmailColumn: columns.some((c: any) => c.column_name === "email"),
      }
    } catch (error) {
      debugResults.tests[2].status = "failed"
      debugResults.tests[2].error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test 4: Check user_sessions table structure
    try {
      debugResults.tests.push({
        test: "User Sessions Table Structure",
        status: "testing",
      })

      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'user_sessions' 
        ORDER BY ordinal_position
      `

      debugResults.tests[3].status = "success"
      debugResults.tests[3].result = {
        columns: columns,
        hasSessionTokenColumn: columns.some((c: any) => c.column_name === "session_token"),
        hasUserIdColumn: columns.some((c: any) => c.column_name === "user_id"),
        hasExpiresAtColumn: columns.some((c: any) => c.column_name === "expires_at"),
      }
    } catch (error) {
      debugResults.tests[3].status = "failed"
      debugResults.tests[3].error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test 5: Sample user count
    try {
      debugResults.tests.push({
        test: "User Count Check",
        status: "testing",
      })

      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      const activeUserCount = await sql`SELECT COUNT(*) as count FROM users WHERE is_active = true`

      debugResults.tests[4].status = "success"
      debugResults.tests[4].result = {
        totalUsers: userCount[0].count,
        activeUsers: activeUserCount[0].count,
      }
    } catch (error) {
      debugResults.tests[4].status = "failed"
      debugResults.tests[4].error = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json(debugResults)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Database debug test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
