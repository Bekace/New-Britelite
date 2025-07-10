import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Auth Me API: GET request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Auth Me API: Session token exists:", !!sessionToken)
    console.log("Auth Me API: Session token preview:", sessionToken ? sessionToken.substring(0, 20) + "..." : "null")

    if (!sessionToken) {
      console.log("Auth Me API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Auth Me API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
      userEmail: user?.email,
    })

    if (!user) {
      console.log("Auth Me API: Session verification failed")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    console.log("Auth Me API: Returning user data")

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
        plan_id: user.plan_id,
        plan_name: user.plan_name,
        max_screens: user.max_screens,
        max_storage_gb: user.max_storage_gb,
        max_playlists: user.max_playlists,
        business_name: user.business_name,
        business_address: user.business_address,
        phone: user.phone,
        avatar_url: user.avatar_url,
      },
    })
  } catch (error) {
    console.error("Auth Me API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Authentication check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
