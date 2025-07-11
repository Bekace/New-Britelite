import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getUserFromSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get media files for the user
    const mediaFiles = await sql`
      SELECT 
        id, filename, original_filename, file_type, file_size, mime_type,
        blob_url, thumbnail_url, duration, width, height, tags, description,
        is_active, created_at, updated_at
      FROM media 
      WHERE user_id = ${user.id} AND is_active = true
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      media: mediaFiles,
    })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}
