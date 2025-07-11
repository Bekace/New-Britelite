import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get user with full profile data including plan information - using 'sessions' table
    const session = await sql`
      SELECT 
        s.user_id,
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_email_verified,
        u.business_name, u.business_address, u.phone, u.avatar_url, u.created_at,
        p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE s.token = ${sessionToken} 
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `

    if (session.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const user = session[0]

    // Remove sensitive data
    const {
      password_hash,
      email_verification_token,
      password_reset_token,
      password_reset_expires,
      user_id,
      ...userData
    } = user

    return NextResponse.json({ success: true, user: userData })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
