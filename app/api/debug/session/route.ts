import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sessionQueries } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Session Debug API: GET request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Session Debug API: Session token exists:", !!sessionToken)
    console.log(
      "Session Debug API: Session token preview:",
      sessionToken ? sessionToken.substring(0, 20) + "..." : "null",
    )

    const debugInfo: any = {
      hasSessionCookie: !!sessionToken,
      sessionTokenPreview: sessionToken ? sessionToken.substring(0, 20) + "..." : null,
      cookieNames: (await cookies()).getAll().map((c) => c.name),
      timestamp: new Date().toISOString(),
    }

    if (!sessionToken) {
      console.log("Session Debug API: No session token found")
      return NextResponse.json({
        success: false,
        error: "No session token",
        debug: debugInfo,
      })
    }

    // Try to verify session
    const user = await authService.verifySession(sessionToken)
    console.log("Session Debug API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
    })

    debugInfo.userVerified = !!user
    debugInfo.userRole = user?.role
    debugInfo.userId = user?.id
    debugInfo.userEmail = user?.email

    // Get raw session data
    try {
      const rawSession = await sessionQueries.findByToken(sessionToken)
      console.log("Session Debug API: Raw session data exists:", !!rawSession)

      debugInfo.rawSessionExists = !!rawSession
      if (rawSession) {
        debugInfo.rawSessionData = {
          user_id: rawSession.user_id,
          email: rawSession.email,
          role: rawSession.role,
          expires_at: rawSession.expires_at,
          created_at: rawSession.created_at,
        }
      }
    } catch (sessionError) {
      console.error("Session Debug API: Error fetching raw session:", sessionError)
      debugInfo.rawSessionError = sessionError instanceof Error ? sessionError.message : "Unknown error"
    }

    return NextResponse.json({
      success: true,
      user: user
        ? {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_email_verified: user.is_email_verified,
          }
        : null,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Session Debug API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Session debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
