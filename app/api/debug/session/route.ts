import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sessionQueries } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug Session API: GET request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Debug Session API: Session token exists:", !!sessionToken)
    console.log(
      "Debug Session API: Session token preview:",
      sessionToken ? sessionToken.substring(0, 20) + "..." : "null",
    )

    const debugInfo: any = {
      hasSessionToken: !!sessionToken,
      sessionTokenPreview: sessionToken ? sessionToken.substring(0, 20) + "..." : null,
      cookies: {},
      headers: {},
      timestamp: new Date().toISOString(),
    }

    // Get all cookies
    const allCookies = cookieStore.getAll()
    debugInfo.cookies = allCookies.reduce((acc: any, cookie) => {
      acc[cookie.name] = cookie.value.substring(0, 20) + "..."
      return acc
    }, {})

    // Get relevant headers
    debugInfo.headers = {
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      origin: request.headers.get("origin"),
      host: request.headers.get("host"),
    }

    if (!sessionToken) {
      console.log("Debug Session API: No session token found")
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
        session: null,
        debug: debugInfo,
      })
    }

    // Verify session
    const user = await authService.verifySession(sessionToken)
    console.log("Debug Session API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
      userEmail: user?.email,
    })

    // Get raw session data
    let rawSession = null
    try {
      rawSession = await sessionQueries.findByToken(sessionToken)
      console.log("Debug Session API: Raw session found:", !!rawSession)
    } catch (error) {
      console.error("Debug Session API: Error fetching raw session:", error)
    }

    debugInfo.sessionVerification = {
      userFound: !!user,
      rawSessionFound: !!rawSession,
      userRole: user?.role,
      userEmail: user?.email,
      sessionExpiry: rawSession?.expires_at,
    }

    return NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            is_email_verified: user.is_email_verified,
          }
        : null,
      session: rawSession
        ? {
            id: rawSession.id,
            user_id: rawSession.user_id,
            expires_at: rawSession.expires_at,
            created_at: rawSession.created_at,
          }
        : null,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Debug Session API: Error:", error)
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
