import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { first_name, last_name, business_name, business_address, phone } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({ success: false, error: "First name and last name are required" }, { status: 400 })
    }

    // Update user profile
    const result = await sql`
      UPDATE users 
      SET 
        first_name = ${first_name},
        last_name = ${last_name},
        business_name = ${business_name || null},
        business_address = ${business_address || null},
        phone = ${phone || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
      RETURNING id, first_name, last_name, business_name, business_address, phone
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: result[0],
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
