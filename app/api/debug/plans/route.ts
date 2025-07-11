import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action !== "run_all_tests") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    const results: Record<string, any> = {}

    // Step 1: Database Connection Test
    try {
      await sql`SELECT 1 as test`
      results["connection"] = {
        success: true,
        data: "Database connection successful",
      }
    } catch (error) {
      results["connection"] = {
        success: false,
        error: `Database connection failed: ${error}`,
      }
    }

    // Step 2: Plans Table Existence Check
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'plans'
        ) as table_exists
      `
      const tableCount = await sql`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'plans'
      `
      results["table-exists"] = {
        success: true,
        data: {
          tableExists: tableCheck[0].table_exists,
          tableCount: Number.parseInt(tableCount[0].count),
        },
      }
    } catch (error) {
      results["table-exists"] = {
        success: false,
        error: `Table existence check failed: ${error}`,
      }
    }

    // Step 3: List All Database Tables
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
      results["all-tables"] = {
        success: true,
        data: {
          totalTables: tables.length,
          tables: tables.map((t) => t.table_name),
        },
      }
    } catch (error) {
      results["all-tables"] = {
        success: false,
        error: `Failed to list tables: ${error}`,
      }
    }

    // Step 4: Plans Table Structure
    try {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'plans'
        ORDER BY ordinal_position
      `
      results["table-structure"] = {
        success: true,
        data: {
          columnCount: columns.length,
          columns: columns,
        },
      }
    } catch (error) {
      results["table-structure"] = {
        success: false,
        error: `Failed to get table structure: ${error}`,
      }
    }

    // Step 5: Total Plans Count
    try {
      const totalCount = await sql`SELECT COUNT(*) as count FROM plans`
      results["total-count"] = {
        success: true,
        data: {
          totalPlans: Number.parseInt(totalCount[0].count),
        },
      }
    } catch (error) {
      results["total-count"] = {
        success: false,
        error: `Failed to count total plans: ${error}`,
      }
    }

    // Step 6: Active Plans Count
    try {
      const activeCount = await sql`SELECT COUNT(*) as count FROM plans WHERE is_active = true`
      results["active-count"] = {
        success: true,
        data: {
          activePlans: Number.parseInt(activeCount[0].count),
        },
      }
    } catch (error) {
      results["active-count"] = {
        success: false,
        error: `Failed to count active plans: ${error}`,
      }
    }

    // Step 7: Sample Plans Data (using correct column names)
    try {
      const samplePlans = await sql`
        SELECT 
          id, name, description, price_monthly, price_yearly, billing_cycle,
          max_screens, max_storage_gb, max_playlists, is_active, created_at
        FROM plans 
        LIMIT 3
      `
      results["sample-data"] = {
        success: true,
        data: {
          sampleCount: samplePlans.length,
          plans: samplePlans,
        },
      }
    } catch (error) {
      results["sample-data"] = {
        success: false,
        error: `Failed to get sample plans: ${error}`,
      }
    }

    // Step 8: API Query Test (using correct column names)
    try {
      const apiQuery = await sql`
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
      results["api-query"] = {
        success: true,
        data: {
          queryResults: apiQuery.length,
          plans: apiQuery,
        },
      }
    } catch (error) {
      results["api-query"] = {
        success: false,
        error: `API query test failed: ${error}`,
      }
    }

    // Step 9: Plan Features Table Check
    try {
      const featuresTableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'plan_features'
        ) as table_exists
      `
      results["plan-features"] = {
        success: true,
        data: {
          tableExists: featuresTableCheck[0].table_exists,
        },
      }
    } catch (error) {
      results["plan-features"] = {
        success: false,
        error: `Plan features table check failed: ${error}`,
      }
    }

    // Step 10: Plan Feature Assignments Table Check
    try {
      const assignmentsTableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'plan_feature_assignments'
        ) as table_exists
      `
      results["plan-assignments"] = {
        success: true,
        data: {
          tableExists: assignmentsTableCheck[0].table_exists,
        },
      }
    } catch (error) {
      results["plan-assignments"] = {
        success: false,
        error: `Plan assignments table check failed: ${error}`,
      }
    }

    // Step 11: Complex Query with Features Test (using correct column names)
    try {
      const complexQuery = await sql`
        SELECT 
          p.*,
          CASE 
            WHEN p.billing_cycle = 'yearly' THEN p.price_yearly
            ELSE p.price_monthly
          END as price,
          COUNT(DISTINCT u.id) as user_count,
          COUNT(DISTINCT pfa.id) as feature_count
        FROM plans p
        LEFT JOIN users u ON p.id = u.plan_id AND u.is_active = true
        LEFT JOIN plan_feature_assignments pfa ON p.id = pfa.plan_id AND pfa.is_enabled = true
        GROUP BY p.id
        ORDER BY 
          CASE 
            WHEN p.billing_cycle = 'yearly' THEN p.price_yearly
            ELSE p.price_monthly
          END ASC
        LIMIT 5
      `
      results["complex-query"] = {
        success: true,
        data: {
          queryResults: complexQuery.length,
          plans: complexQuery,
        },
      }
    } catch (error) {
      results["complex-query"] = {
        success: false,
        error: `Complex query test failed: ${error}`,
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Plans debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during debug",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
