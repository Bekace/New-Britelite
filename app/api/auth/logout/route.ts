import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("Logout API: POST request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Logout API: Session token exists:", !!sessionToken)

    if (sessionToken) {
      console.log("Logout API: Logging out session...")
      await authService.logout(sessionToken)
    }

    // Clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("Logout API: Session cleared successfully")

    return response
  } catch (error) {
    console.error("Logout API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
