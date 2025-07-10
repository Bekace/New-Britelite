import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sessionQueries } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("Logout API: POST request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (sessionToken) {
      console.log("Logout API: Deleting session from database")
      await sessionQueries.delete(sessionToken)
    }

    console.log("Logout API: Clearing session cookie")

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear the session cookie
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    })

    console.log("Logout API: Logout completed successfully")

    return response
  } catch (error) {
    console.error("Logout API: Error during logout:", error)

    const response = NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )

    // Still try to clear the cookie even if database operation failed
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    })

    return response
  }
}
