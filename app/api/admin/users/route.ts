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

    // Fetch all users with plan information - using DISTINCT to avoid duplicates
    const users = await sql`
      SELECT DISTINCT
        u.id, u.email, u.first_name, u.last_name, u.role, u.business_name,
        u.is_email_verified, u.is_active, u.created_at,
        p.name as plan_name,
        (
          SELECT MAX(expires_at) 
          FROM user_sessions 
          WHERE user_id = u.id AND expires_at > NOW()
        ) as last_seen
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { email, first_name, last_name, role = "user", business_name, plan_id } = body

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        {
          success: false,
          error: "Email, first name, and last name are required",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 400 },
      )
    }

    // Create new user
    const newUser = await sql`
      INSERT INTO users (
        email, first_name, last_name, role, business_name, plan_id,
        is_email_verified, is_active, created_at, updated_at
      ) VALUES (
        ${email}, ${first_name}, ${last_name}, ${role}, ${business_name}, ${plan_id},
        true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id, email, first_name, last_name, role, business_name, is_email_verified, is_active, created_at
    `

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser[0],
    })
  } catch (error) {
    console.error("Admin user creation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
