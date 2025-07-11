import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const debugResult = {
      timestamp: new Date().toISOString(),
      email,
      steps: [] as any[],
      environment: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV || "development",
      },
    }

    // Step 1: Test database connection
    try {
      await sql`SELECT 1`
      debugResult.steps.push({
        step: 1,
        name: "Database Connection Test",
        status: "success",
        result: "Database connection successful",
      })
    } catch (error: any) {
      debugResult.steps.push({
        step: 1,
        name: "Database Connection Test",
        status: "failed",
        error: error.message,
        stack: error.stack,
      })
      return NextResponse.json(debugResult)
    }

    // Step 2: Test user lookup
    let user: any = null
    try {
      const result = await sql`
        SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
        FROM users u
        LEFT JOIN plans p ON u.plan_id = p.id
        WHERE u.email = ${email} AND u.is_active = true
      `
      user = result[0] || null

      debugResult.steps.push({
        step: 2,
        name: "User Lookup",
        status: user ? "success" : "failed",
        result: user
          ? {
              userFound: true,
              userId: user.id,
              isEmailVerified: user.is_email_verified,
              isActive: user.is_active,
              role: user.role,
              hasPasswordHash: !!user.password_hash,
              passwordHashLength: user.password_hash?.length || 0,
            }
          : {
              userFound: false,
              message: "No user found with this email",
            },
      })

      if (!user) {
        return NextResponse.json(debugResult)
      }
    } catch (error: any) {
      debugResult.steps.push({
        step: 2,
        name: "User Lookup",
        status: "failed",
        error: error.message,
        stack: error.stack,
      })
      return NextResponse.json(debugResult)
    }

    // Step 3: Test password verification
    try {
      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      debugResult.steps.push({
        step: 3,
        name: "Password Verification",
        status: isValidPassword ? "success" : "failed",
        result: isValidPassword
          ? {
              passwordValid: true,
              hashFormat: "bcrypt",
            }
          : {
              passwordValid: false,
              message: "Password does not match stored hash",
            },
      })

      if (!isValidPassword) {
        return NextResponse.json(debugResult)
      }
    } catch (error: any) {
      debugResult.steps.push({
        step: 3,
        name: "Password Verification",
        status: "failed",
        error: error.message,
        stack: error.stack,
      })
      return NextResponse.json(debugResult)
    }

    // Step 4: Test session token generation
    let sessionToken: string
    try {
      sessionToken = crypto.randomBytes(32).toString("hex")

      debugResult.steps.push({
        step: 4,
        name: "Session Token Generation",
        status: "success",
        result: {
          tokenGenerated: true,
          tokenLength: sessionToken.length,
        },
      })
    } catch (error: any) {
      debugResult.steps.push({
        step: 4,
        name: "Session Token Generation",
        status: "failed",
        error: error.message,
        stack: error.stack,
      })
      return NextResponse.json(debugResult)
    }

    // Step 5: Test session creation
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const sessionResult = await sql`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${user.id}, ${sessionToken}, ${expiresAt.toISOString()})
        RETURNING id, token, expires_at
      `

      debugResult.steps.push({
        step: 5,
        name: "Session Creation Test",
        status: "success",
        result: {
          sessionCreated: true,
          sessionId: sessionResult[0].id,
        },
      })

      // Clean up test session
      await sql`DELETE FROM sessions WHERE token = ${sessionToken}`
    } catch (error: any) {
      debugResult.steps.push({
        step: 5,
        name: "Session Creation Test",
        status: "failed",
        error: error.message,
        stack: error.stack,
      })
    }

    return NextResponse.json(debugResult)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Debug process failed",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
