import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"
import { planQueries } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Plans [id] API: GET request received for plan:", params.id)

    const user = await getCurrentUserFromRequest(request)
    console.log("Plans [id] API: User check:", {
      userExists: !!user,
      userRole: user?.role,
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const plan = await planQueries.findById(params.id)
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan,
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Plans [id] API: PUT request received for plan:", params.id)

    const user = await getCurrentUserFromRequest(request)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, max_screens, max_storage_gb, max_playlists, is_active } = body

    if (!name || !description || price === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const updatedPlan = await planQueries.update(params.id, {
      name,
      description,
      price: Number.parseFloat(price),
      max_screens: max_screens ? Number.parseInt(max_screens) : null,
      max_storage_gb: max_storage_gb ? Number.parseInt(max_storage_gb) : null,
      max_playlists: max_playlists ? Number.parseInt(max_playlists) : null,
      is_active: Boolean(is_active),
    })

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: "Plan updated successfully",
    })
  } catch (error) {
    console.error("Plans [id] API: Error updating plan:", error)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Plans [id] API: DELETE request received for plan:", params.id)

    const user = await getCurrentUserFromRequest(request)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    await planQueries.delete(params.id)

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error) {
    console.error("Plans [id] API: Error deleting plan:", error)
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
