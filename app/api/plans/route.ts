import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Fetch all active plans for public display
    const plans = await sql`
      SELECT 
        id, name, description, price, billing_cycle,
        max_screens, max_storage_gb, max_playlists,
        is_active, created_at
      FROM plans 
      WHERE is_active = true 
      ORDER BY price ASC
    `

    return NextResponse.json({
      success: true,
      plans: plans.map((plan) => ({
        ...plan,
        price: Number.parseFloat(plan.price),
      })),
    })
  } catch (error) {
    console.error("Plans fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch plans",
      },
      { status: 500 },
    )
  }
}
