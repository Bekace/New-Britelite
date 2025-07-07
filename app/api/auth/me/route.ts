import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
