import { type NextRequest, NextResponse } from "next/server"
import { userQueries, sessionQueries } from "@/lib/database"
import { passwordUtils, tokenUtils } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const debugResults = {
      timestamp: new Date().toISOString(),
      email: email,
      steps: [] as any[],
      environment: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    }

    // Step 1: Test database connection
    try {
      debugResults.steps.push({
        step: 1,
        name: "Database Connection Test",
        status: "testing",
      })

      // Simple query to test connection
      const testQuery = await userQueries.findByEmail("test@nonexistent.com")
      debugResults.steps[0].status = "success"
      debugResults.steps[0].result = "Database connection successful"
    } catch (error) {
      debugResults.steps[0].status = "failed"
      debugResults.steps[0].error = error instanceof Error ? error.message : "Unknown error"
      debugResults.steps[0].stack = error instanceof Error ? error.stack : undefined
    }

    // Step 2: User lookup
    try {
      debugResults.steps.push({
        step: 2,
        name: "User Lookup",
        status: "testing",
      })

      const user = await userQueries.findByEmail(email)
      debugResults.steps[1].status = user ? "success" : "not_found"
      debugResults.steps[1].result = {
        userFound: !!user,
        userId: user?.id,
        isEmailVerified: user?.is_email_verified,
        isActive: user?.is_active,
        role: user?.role,
        hasPasswordHash: !!user?.password_hash,
        passwordHashLength: user?.password_hash?.length,
      }
    } catch (error) {
      debugResults.steps[1].status = "failed"
      debugResults.steps[1].error = error instanceof Error ? error.message : "Unknown error"
      debugResults.steps[1].stack = error instanceof Error ? error.stack : undefined
    }

    // Step 3: Password verification (only if user found)
    if (debugResults.steps[1]?.result?.userFound && password) {
      try {
        debugResults.steps.push({
          step: 3,
          name: "Password Verification",
          status: "testing",
        })

        const user = await userQueries.findByEmail(email)
        if (user?.password_hash) {
          const isValidPassword = await passwordUtils.verify(password, user.password_hash)
          debugResults.steps[2].status = isValidPassword ? "success" : "failed"
          debugResults.steps[2].result = {
            passwordValid: isValidPassword,
            hashFormat: user.password_hash.startsWith("$2") ? "bcrypt" : "unknown",
          }
        } else {
          debugResults.steps[2].status = "failed"
          debugResults.steps[2].error = "No password hash found"
        }
      } catch (error) {
        debugResults.steps[2].status = "failed"
        debugResults.steps[2].error = error instanceof Error ? error.message : "Unknown error"
        debugResults.steps[2].stack = error instanceof Error ? error.stack : undefined
      }
    }

    // Step 4: Session token generation
    try {
      debugResults.steps.push({
        step: 4,
        name: "Session Token Generation",
        status: "testing",
      })

      const sessionToken = tokenUtils.generateSessionToken()
      debugResults.steps[debugResults.steps.length - 1].status = "success"
      debugResults.steps[debugResults.steps.length - 1].result = {
        tokenGenerated: !!sessionToken,
        tokenLength: sessionToken.length,
      }
    } catch (error) {
      debugResults.steps[debugResults.steps.length - 1].status = "failed"
      debugResults.steps[debugResults.steps.length - 1].error = error instanceof Error ? error.message : "Unknown error"
    }

    // Step 5: Session creation test (only if user found) - Fixed to use correct table
    if (debugResults.steps[1]?.result?.userFound) {
      try {
        debugResults.steps.push({
          step: 5,
          name: "Session Creation Test",
          status: "testing",
        })

        const user = await userQueries.findByEmail(email)
        if (user) {
          const sessionToken = tokenUtils.generateSessionToken()
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

          const session = await sessionQueries.create(user.id, sessionToken, expiresAt)
          debugResults.steps[debugResults.steps.length - 1].status = "success"
          debugResults.steps[debugResults.steps.length - 1].result = {
            sessionCreated: !!session,
            sessionId: session?.id,
          }

          // Clean up test session
          if (session) {
            await sessionQueries.delete(sessionToken)
          }
        }
      } catch (error) {
        debugResults.steps[debugResults.steps.length - 1].status = "failed"
        debugResults.steps[debugResults.steps.length - 1].error =
          error instanceof Error ? error.message : "Unknown error"
        debugResults.steps[debugResults.steps.length - 1].stack = error instanceof Error ? error.stack : undefined
      }
    }

    return NextResponse.json(debugResults)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
