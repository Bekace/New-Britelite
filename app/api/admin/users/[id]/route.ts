import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json()
    const { first_name, last_name, role, is_active } = body
    const userId = params.id

    // Update user
    const result = await sql`
      UPDATE users 
      SET 
        first_name = COALESCE(${first_name}, first_name),
        last_name = COALESCE(${last_name}, last_name),
        role = COALESCE(${role}, role),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id, first_name, last_name, role, is_active
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: result[0],
    })
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
