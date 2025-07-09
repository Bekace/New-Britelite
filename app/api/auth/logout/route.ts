import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (sessionToken) {
      await authService.logout(sessionToken)
    }

    const response = NextResponse.json({ success: true })

    // Clear session cookie
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
