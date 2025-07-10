import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"
import { planQueries } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Plans API: GET request received")

    const user = await getCurrentUserFromRequest(request)
    console.log("Plans API: User from request:", user ? { id: user.id, email: user.email, role: user.role } : null)

    if (!user) {
      console.log("Plans API: No user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      console.log("Plans API: User role insufficient:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("Plans API: Fetching plans...")
    const plans = await planQueries.findAll()
    console.log("Plans API: Found plans:", plans.length)

    return NextResponse.json({
      success: true,
      plans: plans,
    })
  } catch (error) {
    console.error("Plans API: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Plans API: POST request received")

    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Plans API: Creating plan with data:", body)

    const plan = await planQueries.create(body)
    console.log("Plans API: Plan created:", plan)

    return NextResponse.json({
      success: true,
      plan: plan,
    })
  } catch (error) {
    console.error("Plans API: Create error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
