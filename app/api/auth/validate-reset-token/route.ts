import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token is required" }, { status: 400 })
    }

    // Check if token exists and is not expired
    const result = await sql`
      SELECT id, email, password_reset_expires
      FROM users 
      WHERE password_reset_token = ${token}
        AND password_reset_expires > CURRENT_TIMESTAMP
        AND is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json({ valid: false, error: "Invalid or expired reset token" })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
