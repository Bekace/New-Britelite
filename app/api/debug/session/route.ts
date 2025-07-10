import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: {},
      headers: {},
      user: null,
      session: null,
    }

    // Get all cookies
    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=")
        debugInfo.cookies[name] = value
      })
    }

    // Get relevant headers
    debugInfo.headers = {
      "user-agent": request.headers.get("user-agent"),
      authorization: request.headers.get("authorization"),
      cookie: request.headers.get("cookie"),
      "x-forwarded-for": request.headers.get("x-forwarded-for"),
      "x-real-ip": request.headers.get("x-real-ip"),
    }

    // Try to get current user
    try {
      const user = await getCurrentUserFromRequest(request)
      debugInfo.user = user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            is_email_verified: user.is_email_verified,
          }
        : null
    } catch (error) {
      debugInfo.session = {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Session debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
