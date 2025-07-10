import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Session Debug API: GET request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value
    const allCookies = cookieStore.getAll()

    console.log(
      "Session Debug API: Found cookies:",
      allCookies.map((c) => c.name),
    )

    let sessionData = null
    let user = null

    if (sessionToken) {
      try {
        user = await authService.verifySession(sessionToken)
        sessionData = {
          token: sessionToken.substring(0, 10) + "...",
          valid: !!user,
          user: user
            ? {
                id: user.id,
                email: user.email,
                role: user.role,
                verified: user.is_email_verified,
              }
            : null,
        }
      } catch (error) {
        console.log("Session Debug API: Session verification failed:", error)
        sessionData = {
          token: sessionToken.substring(0, 10) + "...",
          valid: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: {
        all: allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
        session: sessionToken
          ? {
              exists: true,
              length: sessionToken.length,
              preview: sessionToken.substring(0, 10) + "...",
            }
          : null,
      },
      session: sessionData,
      headers: {
        userAgent: request.headers.get("user-agent"),
        origin: request.headers.get("origin"),
        referer: request.headers.get("referer"),
      },
    }

    console.log("Session Debug API: Returning debug info")

    return NextResponse.json({
      success: true,
      data: debugInfo,
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
