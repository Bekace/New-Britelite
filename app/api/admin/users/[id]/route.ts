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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id

    // Prevent admin from deleting themselves
    if (user.id === userId) {
      return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 })
    }

    // Start transaction to delete user and all related data
    await sql.begin(async (sql) => {
      // Delete user sessions
      await sql`DELETE FROM user_sessions WHERE user_id = ${userId}`

      // Delete audit logs
      await sql`DELETE FROM audit_logs WHERE user_id = ${userId}`

      // Delete screen playlist assignments for user's screens
      await sql`
        DELETE FROM screen_playlists 
        WHERE screen_id IN (SELECT id FROM screens WHERE user_id = ${userId})
      `

      // Delete playlist items for user's playlists
      await sql`
        DELETE FROM playlist_items 
        WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = ${userId})
      `

      // Delete playlists
      await sql`DELETE FROM playlists WHERE user_id = ${userId}`

      // Delete screens
      await sql`DELETE FROM screens WHERE user_id = ${userId}`

      // Delete media
      await sql`DELETE FROM media WHERE user_id = ${userId}`

      // Finally delete the user
      await sql`DELETE FROM users WHERE id = ${userId}`
    })

    return NextResponse.json({
      success: true,
      message: "User and all associated data deleted successfully",
    })
  } catch (error) {
    console.error("Admin user deletion error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
