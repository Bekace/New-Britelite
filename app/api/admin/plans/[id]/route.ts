import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("Plans [id] API: GET request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("Plans [id] API: No session token")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Plans [id] API: User role:", user?.role)

    if (!user || user.role !== "admin") {
      console.log("Plans [id] API: Access denied for role:", user?.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    console.log("Plans [id] API: Fetching plan with ID:", id)

    const plans = await sql`
      SELECT * FROM plans WHERE id = ${id}
    `

    if (plans.length === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plans [id] API: Plan found successfully")

    return NextResponse.json({
      success: true,
      plan: plans[0],
    })
  } catch (error) {
    console.error("Plans [id] API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("Plans [id] API: PUT request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, price, billing_cycle, max_screens, max_storage_gb, max_playlists, is_active } = body

    console.log("Plans [id] API: Updating plan:", id)

    const plans = await sql`
      UPDATE plans 
      SET 
        name = ${name},
        description = ${description},
        price = ${price},
        billing_cycle = ${billing_cycle},
        max_screens = ${max_screens},
        max_storage_gb = ${max_storage_gb},
        max_playlists = ${max_playlists},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (plans.length === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plans [id] API: Plan updated successfully")

    return NextResponse.json({
      success: true,
      plan: plans[0],
    })
  } catch (error) {
    console.error("Plans [id] API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("Plans [id] API: DELETE request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    console.log("Plans [id] API: Deleting plan:", id)

    const plans = await sql`
      DELETE FROM plans WHERE id = ${id}
      RETURNING *
    `

    if (plans.length === 0) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    console.log("Plans [id] API: Plan deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error) {
    console.error("Plans [id] API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
