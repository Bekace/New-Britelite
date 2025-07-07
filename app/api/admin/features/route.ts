import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Fetch all plan features
    const features = await sql`
      SELECT * FROM plan_features
      ORDER BY name ASC
    `

    return NextResponse.json({ success: true, features })
  } catch (error) {
    console.error("Admin features fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
