import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { emailService } from "@/lib/email"
import { userQueries } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const result = await authService.requestPasswordReset(email)

    // If successful, send the actual reset email
    if (result.success) {
      const user = await userQueries.findByEmail(email)
      if (user && user.password_reset_token) {
        await emailService.sendPasswordResetEmail(email, user.password_reset_token, user.first_name)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Forgot password API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
