import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (sessionToken) {
      await authService.logout(sessionToken)
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    response.cookies.delete("session")

    return response
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
