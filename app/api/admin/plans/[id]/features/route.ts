import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const planId = params.id

    // Fetch plan features with assignments
    const features = await sql`
      SELECT 
        pfa.id, pfa.plan_id, pfa.feature_id, pfa.is_enabled, pfa.limit_value,
        pf.name, pf.description, pf.feature_key, pf.is_active
      FROM plan_feature_assignments pfa
      JOIN plan_features pf ON pfa.feature_id = pf.id
      WHERE pfa.plan_id = ${planId}
      ORDER BY pf.name ASC
    `

    return NextResponse.json({ success: true, features })
  } catch (error) {
    console.error("Plan features fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

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
    const { feature_id, is_enabled, limit_value } = body
    const planId = params.id

    // Check if assignment already exists
    const existing = await sql`
      SELECT id FROM plan_feature_assignments 
      WHERE plan_id = ${planId} AND feature_id = ${feature_id}
    `

    if (existing.length > 0) {
      // Update existing assignment
      const result = await sql`
        UPDATE plan_feature_assignments 
        SET 
          is_enabled = ${is_enabled},
          limit_value = ${limit_value || null}
        WHERE plan_id = ${planId} AND feature_id = ${feature_id}
        RETURNING *
      `
      return NextResponse.json({
        success: true,
        message: "Plan feature updated successfully",
        assignment: result[0],
      })
    } else {
      // Create new assignment
      const result = await sql`
        INSERT INTO plan_feature_assignments (plan_id, feature_id, is_enabled, limit_value)
        VALUES (${planId}, ${feature_id}, ${is_enabled}, ${limit_value || null})
        RETURNING *
      `
      return NextResponse.json({
        success: true,
        message: "Plan feature assigned successfully",
        assignment: result[0],
      })
    }
  } catch (error) {
    console.error("Plan feature assignment error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
