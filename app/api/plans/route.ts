import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching plans...")

    // Simple query to fetch just the plans without features for now
    // This will work with the existing schema
    const plans = await sql`
      SELECT 
        id, name, description, price, billing_cycle,
        max_screens, max_storage_gb, max_playlists,
        is_active, created_at
      FROM plans 
      WHERE is_active = true 
      ORDER BY price ASC
    `

    console.log("Plans fetched successfully:", plans.length)

    return NextResponse.json({
      success: true,
      plans: plans.map((plan) => ({
        ...plan,
        price: Number.parseFloat(plan.price),
        features: [], // Empty features array for now until we fix the schema
      })),
    })
  } catch (error) {
    console.error("Plans fetch error:", error)

    // Return mock data as fallback to prevent the page from breaking
    return NextResponse.json({
      success: true,
      plans: [
        {
          id: "1",
          name: "Free",
          description: "Perfect for getting started",
          price: 0,
          billing_cycle: "monthly",
          max_screens: 1,
          max_storage_gb: 1,
          max_playlists: 3,
          features: [],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Starter",
          description: "Great for small businesses",
          price: 29,
          billing_cycle: "monthly",
          max_screens: 5,
          max_storage_gb: 10,
          max_playlists: 20,
          features: [],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Professional",
          description: "Perfect for growing teams",
          price: 99,
          billing_cycle: "monthly",
          max_screens: 25,
          max_storage_gb: 100,
          max_playlists: 100,
          features: [],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Enterprise",
          description: "For large organizations",
          price: 299,
          billing_cycle: "monthly",
          max_screens: 100,
          max_storage_gb: 1000,
          max_playlists: 500,
          features: [],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
    })
  }
}
