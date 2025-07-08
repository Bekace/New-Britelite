import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Admin Features API called ===") // Debug log

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log("Session token exists:", !!sessionToken) // Debug log

    if (!sessionToken) {
      console.log("No session token found") // Debug log
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await authService.verifySession(sessionToken)
    console.log("User verified:", !!user, "Role:", user?.role) // Debug log

    if (!user || user.role !== "admin") {
      console.log("Admin access denied") // Debug log
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Fetch all plan features
    const features = await sql`
      SELECT id, name, description, feature_key, is_active, created_at 
      FROM plan_features
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("Raw features from database:", features) // Debug log
    console.log("Features count:", features.length) // Debug log

    return NextResponse.json({
      success: true,
      features: features,
      debug: {
        count: features.length,
        sample: features[0] || null,
      },
    })
  } catch (error) {
    console.error("=== Admin features fetch error ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
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
    const { name, description, feature_key } = body

    // Validate required fields
    if (!name || !feature_key) {
      return NextResponse.json({ success: false, error: "Name and feature key are required" }, { status: 400 })
    }

    // Check if feature key already exists
    const existing = await sql`
      SELECT id FROM plan_features WHERE feature_key = ${feature_key}
    `

    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: "Feature key already exists" }, { status: 400 })
    }

    // Create new feature
    const result = await sql`
      INSERT INTO plan_features (name, description, feature_key)
      VALUES (${name}, ${description || null}, ${feature_key})
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Feature created successfully",
      feature: result[0],
    })
  } catch (error) {
    console.error("Admin feature creation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
