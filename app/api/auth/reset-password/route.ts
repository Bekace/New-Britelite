import { type NextRequest, NextResponse } from "next/server"
import { userQueries, auditQueries } from "@/lib/database"
import { passwordUtils } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and password are required" }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = passwordUtils.validate(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.errors.join(", "),
        },
        { status: 400 },
      )
    }

    // Hash the new password
    const passwordHash = await passwordUtils.hash(password)

    // Reset the password
    const user = await userQueries.resetPassword(token, passwordHash)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset token",
        },
        { status: 400 },
      )
    }

    // Log the password reset
    await auditQueries.log({
      user_id: user.id,
      action: "password_reset_completed",
      details: { email: user.email },
    })

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
