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

    // Fetch all plan features
    const features = await sql`
      SELECT * FROM plan_features
      ORDER BY name ASC
    `

    return NextResponse.json({ success: true, features })
  } catch (error) {
    console.error("Admin features fetch error:", error)
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
