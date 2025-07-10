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
      // Delete session from database
      await authService.logout(sessionToken)
      console.log("Logout API: Session deleted from database")
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
      maxAge: 0, // Expire immediately
      path: "/",
    })

    console.log("Logout API: Session cookie cleared")

    return response
  } catch (error) {
    console.error("Logout API: Error in POST handler:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
