import { type NextRequest, NextResponse } from "next/server"
import { userQueries } from "@/lib/database"
import { emailService } from "@/lib/email"
import { tokenUtils } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const user = await userQueries.findByEmail(email)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (user.is_email_verified) {
      return NextResponse.json({ success: false, error: "Email is already verified" }, { status: 400 })
    }

    // Generate new verification token
    const newToken = tokenUtils.generateEmailToken()

    // Update user with new token
    await userQueries.updateVerificationToken(email, newToken)

    // Send verification email with new token
    const emailResult = await emailService.sendVerificationEmail(user.email, newToken, user.first_name)

    if (!emailResult.success) {
      return NextResponse.json({ success: false, error: "Failed to send verification email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
