import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const result = await sql`
      SELECT id, email, password_hash, first_name, last_name, role, is_email_verified, 
             p.name as plan_name, u.business_name
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.email = ${email.toLowerCase()}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = result[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return NextResponse.json(
        {
          error: "Please verify your email before logging in",
          requiresVerification: true,
        },
        { status: 401 },
      )
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create session
    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `

    // Log the login
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at)
      VALUES (
        ${user.id}, 
        'user_login', 
        ${JSON.stringify({ email: user.email })},
        ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"},
        ${request.headers.get("user-agent") || "unknown"},
        NOW()
      )
    `

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        planName: user.plan_name,
        businessName: user.business_name,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
