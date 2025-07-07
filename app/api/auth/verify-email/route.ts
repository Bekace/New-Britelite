import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ success: false, error: "Verification token is required" }, { status: 400 })
    }

    const result = await authService.verifyEmail(token)

    if (result.success) {
      // Send welcome email after successful verification
      // Note: We'll need to get user info to send welcome email
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error("Email verification API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
