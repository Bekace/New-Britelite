import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  const debugResult = {
    timestamp: new Date().toISOString(),
    steps: [] as Array<{
      step: number
      name: string
      status: "success" | "failed"
      result?: any
      error?: string
      stack?: string
    }>,
    environment: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || "unknown",
    },
  }

  // Step 1: Database Connection Test
  try {
    await sql`SELECT 1 as test`
    debugResult.steps.push({
      step: 1,
      name: "Database Connection Test",
      status: "success",
      result: "Database connection successful",
    })
  } catch (error) {
    debugResult.steps.push({
      step: 1,
      name: "Database Connection Test",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown database error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(debugResult)
  }

  // Step 2: Check if 'plans' table exists
  try {
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'plans'
    `

    debugResult.steps.push({
      step: 2,
      name: "Plans Table Existence Check",
      status: "success",
      result: {
        tableExists: tableCheck.length > 0,
        tableCount: tableCheck.length,
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 2,
      name: "Plans Table Existence Check",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error checking table",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 3: List all tables to see what exists
  try {
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    debugResult.steps.push({
      step: 3,
      name: "List All Database Tables",
      status: "success",
      result: {
        totalTables: allTables.length,
        tables: allTables.map((t) => t.table_name),
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 3,
      name: "List All Database Tables",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error listing tables",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 4: Check plans table structure
  try {
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'plans'
      ORDER BY ordinal_position
    `

    debugResult.steps.push({
      step: 4,
      name: "Plans Table Structure",
      status: "success",
      result: {
        columnCount: tableStructure.length,
        columns: tableStructure,
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 4,
      name: "Plans Table Structure",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error checking table structure",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 5: Count total plans in database
  try {
    const totalPlans = await sql`SELECT COUNT(*) as count FROM plans`

    debugResult.steps.push({
      step: 5,
      name: "Total Plans Count",
      status: "success",
      result: {
        totalPlans: Number.parseInt(totalPlans[0].count),
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 5,
      name: "Total Plans Count",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error counting plans",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 6: Count active plans
  try {
    const activePlans = await sql`SELECT COUNT(*) as count FROM plans WHERE is_active = true`

    debugResult.steps.push({
      step: 6,
      name: "Active Plans Count",
      status: "success",
      result: {
        activePlans: Number.parseInt(activePlans[0].count),
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 6,
      name: "Active Plans Count",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error counting active plans",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 7: Get sample plans data
  try {
    const samplePlans = await sql`
      SELECT id, name, description, price, billing_cycle, is_active, created_at
      FROM plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    debugResult.steps.push({
      step: 7,
      name: "Sample Plans Data",
      status: "success",
      result: {
        sampleCount: samplePlans.length,
        plans: samplePlans,
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 7,
      name: "Sample Plans Data",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error fetching sample plans",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 8: Test the exact query used by the API
  try {
    const apiQuery = await sql`
      SELECT * FROM plans WHERE is_active = true ORDER BY price ASC
    `

    debugResult.steps.push({
      step: 8,
      name: "API Query Test",
      status: "success",
      result: {
        resultCount: apiQuery.length,
        plans: apiQuery,
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 8,
      name: "API Query Test",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error with API query",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 9: Check plan_features table
  try {
    const planFeaturesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'plan_features'
    `

    debugResult.steps.push({
      step: 9,
      name: "Plan Features Table Check",
      status: "success",
      result: {
        tableExists: planFeaturesCheck.length > 0,
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 9,
      name: "Plan Features Table Check",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error checking plan_features table",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 10: Check plan_feature_assignments table
  try {
    const assignmentsCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'plan_feature_assignments'
    `

    debugResult.steps.push({
      step: 10,
      name: "Plan Feature Assignments Table Check",
      status: "success",
      result: {
        tableExists: assignmentsCheck.length > 0,
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 10,
      name: "Plan Feature Assignments Table Check",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error checking plan_feature_assignments table",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  // Step 11: Test the complex query with features
  try {
    const complexQuery = await sql`
      SELECT 
        p.id, p.name, p.description, p.price, p.billing_cycle,
        p.max_screens, p.max_storage_gb, p.max_playlists,
        p.is_active, p.created_at,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN pf.id IS NOT NULL AND pfa.is_enabled = true THEN 
                JSON_BUILD_OBJECT(
                  'id', pf.id,
                  'name', pf.name,
                  'description', pf.description,
                  'feature_key', pf.feature_key
                )
              ELSE NULL 
            END
          ) FILTER (WHERE pf.id IS NOT NULL AND pfa.is_enabled = true), 
          '[]'::json
        ) as features
      FROM plans p
      LEFT JOIN plan_feature_assignments pfa ON p.id = pfa.plan_id AND pfa.is_enabled = true
      LEFT JOIN plan_features pf ON pfa.feature_id = pf.id AND pf.is_active = true
      WHERE p.is_active = true 
      GROUP BY p.id, p.name, p.description, p.price, p.billing_cycle,
               p.max_screens, p.max_storage_gb, p.max_playlists,
               p.is_active, p.created_at
      ORDER BY p.price ASC
    `

    debugResult.steps.push({
      step: 11,
      name: "Complex Query with Features Test",
      status: "success",
      result: {
        resultCount: complexQuery.length,
        plans: complexQuery,
      },
    })
  } catch (error) {
    debugResult.steps.push({
      step: 11,
      name: "Complex Query with Features Test",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error with complex query",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }

  return NextResponse.json(debugResult)
}
