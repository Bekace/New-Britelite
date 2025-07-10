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
    console.log("Session Debug API: Session token length:", sessionToken?.length || 0)

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: "No session token found",
        cookies: Object.fromEntries(Array.from(cookieStore.getAll()).map((cookie) => [cookie.name, cookie.value])),
        headers: Object.fromEntries(request.headers.entries()),
      })
    }

    // Get session from database
    const session = await sessionQueries.findByToken(sessionToken)
    console.log("Session Debug API: Database session found:", !!session)

    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Session not found in database",
        sessionToken: sessionToken.substring(0, 10) + "...",
        cookies: Object.fromEntries(Array.from(cookieStore.getAll()).map((cookie) => [cookie.name, cookie.value])),
      })
    }

    // Verify session through auth service
    const user = await authService.verifySession(sessionToken)
    console.log("Session Debug API: Auth service verification:", !!user)

    return NextResponse.json({
      success: true,
      data: {
        sessionToken: sessionToken.substring(0, 10) + "...",
        sessionExists: !!session,
        userVerified: !!user,
        sessionData: {
          userId: session.user_id,
          email: session.email,
          role: session.role,
          planName: session.plan_name,
          isEmailVerified: session.is_email_verified,
        },
        userData: user
          ? {
              id: user.id,
              email: user.email,
              role: user.role,
              planName: user.plan_name,
            }
          : null,
        cookies: Object.fromEntries(Array.from(cookieStore.getAll()).map((cookie) => [cookie.name, cookie.value])),
        headers: {
          userAgent: request.headers.get("user-agent"),
          origin: request.headers.get("origin"),
          referer: request.headers.get("referer"),
          host: request.headers.get("host"),
        },
      },
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
