import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const result = await authService.login(email, password)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: result.message,
    })

    if (result.token) {
      response.cookies.set("session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })
    }

    return response
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
