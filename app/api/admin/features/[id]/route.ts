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
    const { name, description, feature_key, is_active } = body

    // Validate required fields
    if (!name || !feature_key) {
      return NextResponse.json({ success: false, error: "Name and feature key are required" }, { status: 400 })
    }

    // Check if feature key already exists (excluding current feature)
    const existing = await sql`
      SELECT id FROM plan_features 
      WHERE feature_key = ${feature_key} AND id != ${params.id}
    `

    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: "Feature key already exists" }, { status: 400 })
    }

    // Update feature
    const result = await sql`
      UPDATE plan_features 
      SET name = ${name}, 
          description = ${description || null}, 
          feature_key = ${feature_key},
          is_active = ${is_active !== undefined ? is_active : true},
          updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Feature updated successfully",
      feature: result[0],
    })
  } catch (error) {
    console.error("Admin feature update error:", error)
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

    // Check if feature is assigned to any plans
    const assignments = await sql`
      SELECT COUNT(*) as count FROM plan_feature_assignments 
      WHERE feature_id = ${params.id}
    `

    if (assignments[0].count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete feature that is assigned to plans. Remove from plans first.",
        },
        { status: 400 },
      )
    }

    // Delete feature
    const result = await sql`
      DELETE FROM plan_features 
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully",
    })
  } catch (error) {
    console.error("Admin feature delete error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
