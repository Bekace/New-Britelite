import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's media files
    const files = await sql`
      SELECT 
        id, filename, original_filename, file_type, file_size, mime_type,
        blob_url, thumbnail_url, width, height, duration, tags, description,
        created_at, updated_at
      FROM media 
      WHERE user_id = ${user.id} AND is_active = true
      ORDER BY created_at DESC
    `

    // Get storage usage
    const storageUsage = await sql`
      SELECT COALESCE(SUM(file_size), 0) as total_bytes
      FROM media 
      WHERE user_id = ${user.id} AND is_active = true
    `

    const totalBytes = Number.parseInt(storageUsage[0].total_bytes)
    const totalMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100

    return NextResponse.json({
      success: true,
      files,
      storage: {
        totalBytes,
        totalMB,
        totalFiles: files.length,
      },
    })
  } catch (error) {
    console.error("Media fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}
