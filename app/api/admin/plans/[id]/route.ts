import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Plans API: PUT request received for plan:", params.id)

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("Plans API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Plans API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
    })

    if (!user || user.role !== "super_admin") {
      console.log("Plans API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Plans API: Update request body:", body)

    const { name, description, price, billing_cycle, max_screens, max_storage_gb, max_playlists, is_active } = body
    const planId = params.id

    console.log("Plans API: Updating plan:", planId)

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
      console.log("Plans API: Plan not found:", planId)
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plans API: Plan updated successfully:", result[0])

    return NextResponse.json({
      success: true,
      message: "Plan updated successfully",
      plan: result[0],
    })
  } catch (error) {
    console.error("Plans API: Error in PUT handler:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Plans API: DELETE request received for plan:", params.id)

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("Plans API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Plans API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
    })

    if (!user || user.role !== "super_admin") {
      console.log("Plans API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const planId = params.id

    console.log("Plans API: Checking if plan has users")

    // Check if plan has users
    const usersWithPlan = await sql`
      SELECT COUNT(*) as count FROM users WHERE plan_id = ${planId} AND is_active = true
    `

    if (Number.parseInt(usersWithPlan[0].count) > 0) {
      console.log("Plans API: Cannot delete plan with active users")
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete plan with active users",
        },
        { status: 400 },
      )
    }

    console.log("Plans API: Deleting plan:", planId)

    // Delete plan
    const result = await sql`
      DELETE FROM plans WHERE id = ${planId} RETURNING *
    `

    if (result.length === 0) {
      console.log("Plans API: Plan not found:", planId)
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plans API: Plan deleted successfully:", result[0])

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error) {
    console.error("Plans API: Error in DELETE handler:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
