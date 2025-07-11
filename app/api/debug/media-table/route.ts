import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // Check if media table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media'
      );
    `

    if (!tableExists[0].exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Media table does not exist",
        },
        { status: 404 },
      )
    }

    // Get table structure
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'media'
      ORDER BY ordinal_position;
    `

    // Get sample data count
    const dataCount = await sql`
      SELECT COUNT(*) as total FROM media;
    `

    // Get recent uploads
    const recentUploads = await sql`
      SELECT id, original_filename, file_type, file_size, created_at, user_id
      FROM media 
      ORDER BY created_at DESC 
      LIMIT 5;
    `

    return NextResponse.json({
      success: true,
      tableExists: true,
      structure: tableStructure,
      totalFiles: dataCount[0].total,
      recentUploads: recentUploads,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Media table debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
