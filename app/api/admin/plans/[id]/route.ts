import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Plan Detail API: GET request received for ID:", params.id)

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("Plan Detail API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Plan Detail API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
    })

    if (!user || user.role !== "super_admin") {
      console.log("Plan Detail API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    console.log("Plan Detail API: Fetching plan from database")

    const plans = await sql`
      SELECT 
        p.*,
        COUNT(u.id) as user_count
      FROM plans p
      LEFT JOIN users u ON p.id = u.plan_id AND u.is_active = true
      WHERE p.id = ${params.id}
      GROUP BY p.id
    `

    if (plans.length === 0) {
      console.log("Plan Detail API: Plan not found")
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plan Detail API: Plan found:", plans[0])

    return NextResponse.json({
      success: true,
      plan: plans[0],
    })
  } catch (error) {
    console.error("Plan Detail API: Error in GET handler:", error)
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Plan Update API: PUT request received for ID:", params.id)

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("Plan Update API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Plan Update API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
    })

    if (!user || user.role !== "super_admin") {
      console.log("Plan Update API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Plan Update API: Request body:", body)

    const { name, description, price, billing_cycle, max_screens, max_storage_gb, max_playlists, is_active } = body

    // Validate required fields
    if (!name || price === undefined) {
      console.log("Plan Update API: Missing required fields")
      return NextResponse.json({ success: false, error: "Name and price are required" }, { status: 400 })
    }

    console.log("Plan Update API: Updating plan in database")

    // Update plan
    const result = await sql`
      UPDATE plans 
      SET 
        name = ${name},
        description = ${description || null},
        price = ${price},
        billing_cycle = ${billing_cycle || "monthly"},
        max_screens = ${max_screens || 1},
        max_storage_gb = ${max_storage_gb || 1},
        max_playlists = ${max_playlists || 5},
        is_active = ${is_active !== undefined ? is_active : true},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      console.log("Plan Update API: Plan not found")
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plan Update API: Plan updated successfully:", result[0])

    return NextResponse.json({
      success: true,
      message: "Plan updated successfully",
      plan: result[0],
    })
  } catch (error) {
    console.error("Plan Update API: Error in PUT handler:", error)
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
    console.log("Plan Delete API: DELETE request received for ID:", params.id)

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("Plan Delete API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Plan Delete API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
    })

    if (!user || user.role !== "super_admin") {
      console.log("Plan Delete API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    console.log("Plan Delete API: Checking if plan has users")

    // Check if plan has active users
    const usersWithPlan = await sql`
      SELECT COUNT(*) as user_count
      FROM users 
      WHERE plan_id = ${params.id} AND is_active = true
    `

    if (usersWithPlan[0].user_count > 0) {
      console.log("Plan Delete API: Plan has active users, cannot delete")
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete plan with ${usersWithPlan[0].user_count} active users`,
        },
        { status: 400 },
      )
    }

    console.log("Plan Delete API: Deleting plan from database")

    // Delete plan
    const result = await sql`
      DELETE FROM plans 
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      console.log("Plan Delete API: Plan not found")
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plan Delete API: Plan deleted successfully:", result[0])

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
      plan: result[0],
    })
  } catch (error) {
    console.error("Plan Delete API: Error in DELETE handler:", error)
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
