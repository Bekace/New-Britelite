import type { NextRequest } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (step: string, status: "success" | "failed" | "running", result?: any, error?: string) => {
        const data = JSON.stringify({ step, status, result, error })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      try {
        // Step 1: Test database connection
        sendUpdate("connection", "running")
        try {
          await sql`SELECT 1 as test`
          sendUpdate("connection", "success", "Database connection successful")
        } catch (error) {
          sendUpdate("connection", "failed", null, error instanceof Error ? error.message : "Connection failed")
          controller.close()
          return
        }

        // Step 2: Check if plans table exists
        sendUpdate("table-exists", "running")
        try {
          const tableCheck = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'plans'
            ) as table_exists
          `
          const tableCount =
            await sql`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plans'`
          sendUpdate("table-exists", "success", {
            tableExists: tableCheck[0].table_exists,
            tableCount: Number.parseInt(tableCount[0].count),
          })
        } catch (error) {
          sendUpdate("table-exists", "failed", null, error instanceof Error ? error.message : "Table check failed")
        }

        // Step 3: List all tables
        sendUpdate("all-tables", "running")
        try {
          const allTables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
          `
          sendUpdate("all-tables", "success", {
            totalTables: allTables.length,
            tables: allTables.map((t) => t.table_name),
          })
        } catch (error) {
          sendUpdate("all-tables", "failed", null, error instanceof Error ? error.message : "Failed to list tables")
        }

        // Step 4: Get plans table structure
        sendUpdate("table-structure", "running")
        try {
          const columns = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans'
            ORDER BY ordinal_position
          `
          sendUpdate("table-structure", "success", {
            columnCount: columns.length,
            columns: columns,
          })
        } catch (error) {
          sendUpdate(
            "table-structure",
            "failed",
            null,
            error instanceof Error ? error.message : "Failed to get table structure",
          )
        }

        // Step 5: Count total plans
        sendUpdate("total-count", "running")
        try {
          const totalCount = await sql`SELECT COUNT(*) as count FROM plans`
          sendUpdate("total-count", "success", {
            totalPlans: Number.parseInt(totalCount[0].count),
          })
        } catch (error) {
          sendUpdate("total-count", "failed", null, error instanceof Error ? error.message : "Failed to count plans")
        }

        // Step 6: Count active plans
        sendUpdate("active-count", "running")
        try {
          const activeCount = await sql`SELECT COUNT(*) as count FROM plans WHERE is_active = true`
          sendUpdate("active-count", "success", {
            activePlans: Number.parseInt(activeCount[0].count),
          })
        } catch (error) {
          sendUpdate(
            "active-count",
            "failed",
            null,
            error instanceof Error ? error.message : "Failed to count active plans",
          )
        }

        // Step 7: Get sample plans data
        sendUpdate("sample-data", "running")
        try {
          const samplePlans = await sql`
            SELECT id, name, description, price_monthly, price_yearly, billing_cycle, 
                   max_screens, max_storage_gb, max_playlists, is_active, created_at
            FROM plans 
            LIMIT 3
          `
          sendUpdate("sample-data", "success", {
            sampleCount: samplePlans.length,
            plans: samplePlans,
          })
        } catch (error) {
          sendUpdate(
            "sample-data",
            "failed",
            null,
            error instanceof Error ? error.message : "Failed to get sample data",
          )
        }

        // Step 8: Test the exact API query (corrected)
        sendUpdate("api-query", "running")
        try {
          const apiQuery = await sql`
            SELECT 
              id, name, description, 
              CASE 
                WHEN billing_cycle = 'yearly' THEN price_yearly 
                ELSE price_monthly 
              END as price,
              billing_cycle,
              max_screens, max_storage_gb, max_playlists,
              is_active, created_at
            FROM plans 
            WHERE is_active = true 
            ORDER BY 
              CASE 
                WHEN billing_cycle = 'yearly' THEN price_yearly 
                ELSE price_monthly 
              END ASC
          `
          sendUpdate("api-query", "success", {
            queryResults: apiQuery.length,
            plans: apiQuery,
          })
        } catch (error) {
          sendUpdate("api-query", "failed", null, error instanceof Error ? error.message : "API query failed")
        }

        // Step 9: Check plan_features table
        sendUpdate("features-table", "running")
        try {
          const featuresTableCheck = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'plan_features'
            ) as table_exists
          `
          sendUpdate("features-table", "success", {
            tableExists: featuresTableCheck[0].table_exists,
          })
        } catch (error) {
          sendUpdate(
            "features-table",
            "failed",
            null,
            error instanceof Error ? error.message : "Features table check failed",
          )
        }

        // Step 10: Check plan_feature_assignments table
        sendUpdate("assignments-table", "running")
        try {
          const assignmentsTableCheck = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'plan_feature_assignments'
            ) as table_exists
          `
          sendUpdate("assignments-table", "success", {
            tableExists: assignmentsTableCheck[0].table_exists,
          })
        } catch (error) {
          sendUpdate(
            "assignments-table",
            "failed",
            null,
            error instanceof Error ? error.message : "Assignments table check failed",
          )
        }

        // Step 11: Test complex query with features (corrected)
        sendUpdate("complex-query", "running")
        try {
          const complexQuery = await sql`
            SELECT 
              p.id, p.name, p.description, 
              CASE 
                WHEN p.billing_cycle = 'yearly' THEN p.price_yearly 
                ELSE p.price_monthly 
              END as price,
              p.billing_cycle,
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
            GROUP BY p.id, p.name, p.description, p.price_monthly, p.price_yearly, p.billing_cycle,
                     p.max_screens, p.max_storage_gb, p.max_playlists,
                     p.is_active, p.created_at
            ORDER BY 
              CASE 
                WHEN p.billing_cycle = 'yearly' THEN p.price_yearly 
                ELSE p.price_monthly 
              END ASC
          `
          sendUpdate("complex-query", "success", {
            queryResults: complexQuery.length,
            plans: complexQuery,
          })
        } catch (error) {
          sendUpdate("complex-query", "failed", null, error instanceof Error ? error.message : "Complex query failed")
        }
      } catch (error) {
        console.error("Debug stream error:", error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
