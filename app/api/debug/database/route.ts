import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const connectionTest = await sql`SELECT NOW() as current_time`

    // Check table existence
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    // Check sessions table structure
    let sessionsStructure = null
    try {
      sessionsStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        ORDER BY ordinal_position
      `
    } catch (error) {
      sessionsStructure = { error: "Sessions table not found or inaccessible" }
    }

    // Check users table structure
    let usersStructure = null
    try {
      usersStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `
    } catch (error) {
      usersStructure = { error: "Users table not found or inaccessible" }
    }

    return NextResponse.json({
      connection: {
        status: "success",
        timestamp: connectionTest[0].current_time,
      },
      tables: tables.map((t) => t.table_name),
      tableStructures: {
        sessions: sessionsStructure,
        users: usersStructure,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        connection: {
          status: "failed",
          error: error.message,
        },
      },
      { status: 500 },
    )
  }
}
