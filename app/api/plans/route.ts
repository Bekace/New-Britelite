import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Fetch all active plans with their assigned features
    const plans = await sql`
      SELECT 
        p.id, p.name, p.description, p.price, p.billing_cycle,
        p.max_screens, p.max_storage_gb, p.max_playlists,
        p.is_active, p.created_at,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN f.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'id', f.id,
                  'name', f.name,
                  'description', f.description,
                  'feature_key', f.feature_key
                )
              ELSE NULL 
            END
          ) FILTER (WHERE f.id IS NOT NULL), 
          '[]'::json
        ) as features
      FROM plans p
      LEFT JOIN plan_features pf ON p.id = pf.plan_id AND pf.is_enabled = true
      LEFT JOIN features f ON pf.feature_id = f.id AND f.is_active = true
      WHERE p.is_active = true 
      GROUP BY p.id, p.name, p.description, p.price, p.billing_cycle,
               p.max_screens, p.max_storage_gb, p.max_playlists,
               p.is_active, p.created_at
      ORDER BY p.price ASC
    `

    return NextResponse.json({
      success: true,
      plans: plans.map((plan) => ({
        ...plan,
        price: Number.parseFloat(plan.price),
        features: Array.isArray(plan.features) ? plan.features : [],
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
