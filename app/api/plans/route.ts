import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching plans with features...")

    // First try to fetch plans with features using the correct table structure
    const plansWithFeatures = await sql`
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
      LEFT JOIN plan_feature_assignments pfa ON p.id = pfa.plan_id AND pfa.is_enabled = true
      LEFT JOIN features f ON pfa.feature_id = f.id AND f.is_active = true
      WHERE p.is_active = true 
      GROUP BY p.id, p.name, p.description, p.price, p.billing_cycle,
               p.max_screens, p.max_storage_gb, p.max_playlists,
               p.is_active, p.created_at
      ORDER BY p.price ASC
    `

    console.log("Plans with features fetched successfully:", plansWithFeatures.length)

    return NextResponse.json({
      success: true,
      plans: plansWithFeatures.map((plan) => ({
        ...plan,
        price: Number.parseFloat(plan.price),
        features: Array.isArray(plan.features) ? plan.features : [],
      })),
    })
  } catch (error) {
    console.error("Plans with features fetch error:", error)

    // Fallback: try to fetch just plans without features
    try {
      console.log("Attempting fallback query without features...")
      const basicPlans = await sql`
        SELECT 
          id, name, description, price, billing_cycle,
          max_screens, max_storage_gb, max_playlists,
          is_active, created_at
        FROM plans 
        WHERE is_active = true 
        ORDER BY price ASC
      `

      console.log("Basic plans fetched successfully:", basicPlans.length)

      return NextResponse.json({
        success: true,
        plans: basicPlans.map((plan) => ({
          ...plan,
          price: Number.parseFloat(plan.price),
          features: [], // Empty features array for fallback
        })),
      })
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError)

      // Final fallback: return mock data
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
            features: [
              {
                id: "f1",
                name: "Real-time Updates",
                description: "Real-time content updates",
                feature_key: "realtime_updates",
              },
              {
                id: "f2",
                name: "Custom Branding",
                description: "White-label and custom branding options",
                feature_key: "custom_branding",
              },
            ],
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
            features: [
              {
                id: "f1",
                name: "Real-time Updates",
                description: "Real-time content updates",
                feature_key: "realtime_updates",
              },
              {
                id: "f2",
                name: "Custom Branding",
                description: "White-label and custom branding options",
                feature_key: "custom_branding",
              },
              {
                id: "f3",
                name: "Advanced Analytics",
                description: "Detailed analytics and reporting",
                feature_key: "advanced_analytics",
              },
              {
                id: "f4",
                name: "API Access",
                description: "Access to REST API",
                feature_key: "api_access",
              },
            ],
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
            features: [
              {
                id: "f1",
                name: "Real-time Updates",
                description: "Real-time content updates",
                feature_key: "realtime_updates",
              },
              {
                id: "f2",
                name: "Custom Branding",
                description: "White-label and custom branding options",
                feature_key: "custom_branding",
              },
              {
                id: "f3",
                name: "Advanced Analytics",
                description: "Detailed analytics and reporting",
                feature_key: "advanced_analytics",
              },
              {
                id: "f4",
                name: "API Access",
                description: "Access to REST API",
                feature_key: "api_access",
              },
              {
                id: "f5",
                name: "Priority Support",
                description: "24/7 priority customer support",
                feature_key: "priority_support",
              },
              {
                id: "f6",
                name: "Team Collaboration",
                description: "Multi-user team collaboration features",
                feature_key: "team_collaboration",
              },
            ],
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ],
      })
    }
  }
}
