import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"
import { planQueries } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const plan = await planQueries.findById(params.id)

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: plan,
    })
  } catch (error) {
    console.error("Plan GET error:", error)
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
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const plan = await planQueries.update(params.id, body)

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: plan,
    })
  } catch (error) {
    console.error("Plan PUT error:", error)
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
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const deleted = await planQueries.delete(params.id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error) {
    console.error("Plan DELETE error:", error)
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
