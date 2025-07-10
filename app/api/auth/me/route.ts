import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        planName: user.plan_name,
        businessName: user.business_name,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
