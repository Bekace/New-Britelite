import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Plans API: GET request received")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Plans API: Session token exists:", !!sessionToken)

    if (!sessionToken) {
      console.log("Plans API: No session token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("Plans API: User verification result:", {
      userExists: !!user,
      userRole: user?.role,
      userId: user?.id,
    })

    if (!user) {
      console.log("Plans API: Session verification failed")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    if (user.role !== "super_admin") {
      console.log("Plans API: Access denied for role:", user.role)
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    console.log("Plans API: Fetching plans from database")

    // Fetch all plans with user counts
    const plans = await sql`
      SELECT 
        p.*,
        COUNT(u.id) as user_count
      FROM plans p
      LEFT JOIN users u ON p.id = u.plan_id AND u.is_active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `

    console.log("Plans API: Database query result:", {
      planCount: plans.length,
      plans: plans.map((p) => ({ id: p.id, name: p.name, user_count: p.user_count })),
    })

    return NextResponse.json({
      success: true,
      plans: plans,
      message: "Plans fetched successfully",
    })
  } catch (error) {
    console.error("Plans API: Error in GET handler:", error)
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

export async function POST(request: NextRequest) {
  try {
    console.log("Plans API: POST request received")

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
    console.log("Plans API: Request body:", body)

    const { name, description, price, billing_cycle, max_screens, max_storage_gb, max_playlists, is_active } = body

    // Validate required fields
    if (!name || price === undefined) {
      console.log("Plans API: Missing required fields")
      return NextResponse.json({ success: false, error: "Name and price are required" }, { status: 400 })
    }

    console.log("Plans API: Creating new plan")

    // Create new plan
    const result = await sql`
      INSERT INTO plans (
        name, description, price, billing_cycle, 
        max_screens, max_storage_gb, max_playlists, is_active
      )
      VALUES (
        ${name}, 
        ${description || null}, 
        ${price}, 
        ${billing_cycle || "monthly"},
        ${max_screens || 1}, 
        ${max_storage_gb || 1}, 
        ${max_playlists || 5},
        ${is_active !== undefined ? is_active : true}
      )
      RETURNING *
    `

    console.log("Plans API: Plan created successfully:", result[0])

    return NextResponse.json({
      success: true,
      message: "Plan created successfully",
      plan: result[0],
    })
  } catch (error) {
    console.error("Plans API: Error in POST handler:", error)
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
