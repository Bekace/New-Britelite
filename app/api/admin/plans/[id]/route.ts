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
    const { name, description, price, billing_cycle, max_screens, max_storage_gb, max_playlists, is_active } = body
    const planId = params.id

    // Update plan
    const result = await sql`
      UPDATE plans 
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        price = COALESCE(${price}, price),
        billing_cycle = COALESCE(${billing_cycle}, billing_cycle),
        max_screens = COALESCE(${max_screens}, max_screens),
        max_storage_gb = COALESCE(${max_storage_gb}, max_storage_gb),
        max_playlists = COALESCE(${max_playlists}, max_playlists),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${planId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Plan updated successfully",
      plan: result[0],
    })
  } catch (error) {
    console.error("Admin plan update error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
