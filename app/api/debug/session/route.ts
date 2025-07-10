import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug Session API: GET request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value
    const allCookies = cookieStore.getAll()

    console.log("Debug Session API: Session token exists:", !!sessionToken)
    console.log("Debug Session API: All cookies count:", allCookies.length)

    if (!sessionToken) {
      console.log("Debug Session API: No session token found")
      return NextResponse.json({
        success: false,
        error: "No session token found",
        cookies: allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
        sessionToken: null,
      })
    }

    console.log("Debug Session API: Verifying session...")
    const user = await authService.verifySession(sessionToken)

    console.log("Debug Session API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
      userEmail: user?.email,
    })

    return NextResponse.json({
      success: true,
      sessionToken: sessionToken.substring(0, 20) + "...",
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
      cookies: allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
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
