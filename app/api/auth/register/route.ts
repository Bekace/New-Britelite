import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { emailService } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, businessName } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Register user
    const result = await authService.register({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      business_name: businessName,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Send verification email
    if (result.user) {
      await emailService.sendVerificationEmail(
        result.user.email,
        "verification-token", // In real implementation, get from user creation
        result.user.first_name,
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Registration API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
