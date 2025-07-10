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
      sessionToken ? sessionToken.substring(0, 10) + "..." : "null",
    )

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: "No session token found",
        sessionToken: null,
        cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
      })
    }

    // Verify session using auth service
    const user = await authService.verifySession(sessionToken)
    console.log("Debug Session API: Auth service verification:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
    })

    // Get raw session data from database
    let rawSessionData = null
    try {
      rawSessionData = await sessionQueries.findByToken(sessionToken)
      console.log("Debug Session API: Raw session data:", {
        sessionExists: !!rawSessionData,
        sessionUserId: rawSessionData?.id,
        sessionRole: rawSessionData?.role,
      })
    } catch (error) {
      console.error("Debug Session API: Error fetching raw session:", error)
    }

    return NextResponse.json({
      success: true,
      sessionToken: sessionToken ? sessionToken.substring(0, 20) + "..." : null,
      authServiceResult: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            is_email_verified: user.is_email_verified,
          }
        : null,
      rawSessionData: rawSessionData
        ? {
            id: rawSessionData.id,
            email: rawSessionData.email,
            role: rawSessionData.role,
            is_email_verified: rawSessionData.is_email_verified,
            plan_name: rawSessionData.plan_name,
          }
        : null,
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value.substring(0, 20) + "..."])),
      timestamp: new Date().toISOString(),
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
