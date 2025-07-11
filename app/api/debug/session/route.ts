import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const cookies = request.cookies.getAll()
    const cookieNames = cookies.map((c) => c.name)

    // Try to get user from session
    const user = await getUserFromSession(request)

    // Check specific session cookies
    const sessionToken = request.cookies.get("session-token")?.value
    const sessionCookie = request.cookies.get("session")?.value
    const authToken = request.cookies.get("auth-token")?.value

    return NextResponse.json({
      success: true,
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        : null,
      cookies: {
        all: cookieNames,
        sessionToken: sessionToken ? "present" : "missing",
        sessionCookie: sessionCookie ? "present" : "missing",
        authToken: authToken ? "present" : "missing",
      },
      sessionValid: !!user,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Session debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
