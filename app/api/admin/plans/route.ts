import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
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

    // Fetch all plans with user counts - using correct column names
    const plans = await sql`
      SELECT 
        p.*,
        CASE 
          WHEN p.billing_cycle = 'yearly' THEN p.price_yearly
          ELSE p.price_monthly
        END as price,
        COUNT(u.id) as user_count
      FROM plans p
      LEFT JOIN users u ON p.id = u.plan_id AND u.is_active = true
      GROUP BY p.id
      ORDER BY 
        CASE 
          WHEN p.billing_cycle = 'yearly' THEN p.price_yearly
          ELSE p.price_monthly
        END ASC
    `

    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error("Admin plans fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { name, description, price, billing_cycle, max_screens, max_storage_gb, max_playlists } = body

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: "Name and price are required" }, { status: 400 })
    }

    // Create new plan - using correct column names
    const result = await sql`
      INSERT INTO plans (
        name, description, price_monthly, price_yearly, billing_cycle, 
        max_screens, max_storage_gb, max_playlists
      )
      VALUES (
        ${name}, ${description || null}, 
        ${billing_cycle === "yearly" ? 0 : price}, 
        ${billing_cycle === "yearly" ? price : 0}, 
        ${billing_cycle || "monthly"},
        ${max_screens || 1}, ${max_storage_gb || 1}, ${max_playlists || 5}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Plan created successfully",
      plan: result[0],
    })
  } catch (error) {
    console.error("Admin plan creation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
