import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: {} as Record<string, string>,
      headers: {} as Record<string, string>,
      user: null as any,
      sessionToken: null as string | null,
    }

    // Get cookies
    request.cookies.getAll().forEach((cookie) => {
      debugInfo.cookies[cookie.name] = cookie.value
    })

    // Get headers
    request.headers.forEach((value, key) => {
      debugInfo.headers[key] = value
    })

    // Get session token
    debugInfo.sessionToken = request.cookies.get("session")?.value || null

    // Get user
    try {
      debugInfo.user = await getCurrentUserFromRequest(request)
    } catch (error) {
      debugInfo.user = { error: error instanceof Error ? error.message : "Unknown error" }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Debug session error:", error)
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
