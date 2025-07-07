import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Fetch all users with plan information
    const users = await sql`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.business_name,
        u.is_email_verified, u.is_active, u.created_at,
        p.name as plan_name,
        s.expires_at as last_seen
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      LEFT JOIN user_sessions s ON u.id = s.user_id
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
