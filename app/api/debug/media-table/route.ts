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
          tableExists: false,
        },
        { status: 404 },
      )
    }

    // Get table structure
    const structure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'media'
      ORDER BY ordinal_position;
    `

    // Get total file count
    const totalFiles = await sql`
      SELECT COUNT(*) as count FROM media WHERE is_active = true;
    `

    // Get recent uploads
    const recentUploads = await sql`
      SELECT id, filename, original_filename, file_type, file_size, created_at
      FROM media 
      WHERE is_active = true
      ORDER BY created_at DESC 
      LIMIT 5;
    `

    return NextResponse.json({
      success: true,
      tableExists: true,
      structure,
      totalFiles: totalFiles[0].count,
      recentUploads,
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
