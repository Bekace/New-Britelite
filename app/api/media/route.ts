import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Media API - Starting request")

    const user = await getUserFromSession(request)
    console.log("Media API - User from session:", !!user)

    if (!user) {
      console.log("Media API - No user found, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Media API - Fetching files for user:", user.id)

    const files = await sql`
      SELECT 
        id,
        filename,
        original_filename,
        file_type,
        file_size,
        mime_type,
        blob_url,
        thumbnail_url,
        duration,
        width,
        height,
        tags,
        description,
        is_active,
        created_at,
        updated_at
      FROM media 
      WHERE user_id = ${user.id} AND is_active = true
      ORDER BY created_at DESC
    `

    console.log("Media API - Found files:", files.length)

    return NextResponse.json({
      success: true,
      files: files,
      count: files.length,
    })
  } catch (error) {
    console.error("Media API error:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}
