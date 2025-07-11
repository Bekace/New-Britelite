import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")

    let files
    if (folderId === "null" || folderId === null) {
      // Get files without folder (uncategorized)
      files = await sql`
        SELECT m.*, f.name as folder_name 
        FROM media m
        LEFT JOIN folders f ON m.folder_id = f.id
        WHERE m.user_id = ${user.id} AND m.is_active = true AND m.folder_id IS NULL
        ORDER BY m.created_at DESC
      `
    } else if (folderId) {
      // Get files in specific folder
      files = await sql`
        SELECT m.*, f.name as folder_name 
        FROM media m
        LEFT JOIN folders f ON m.folder_id = f.id
        WHERE m.user_id = ${user.id} AND m.is_active = true AND m.folder_id = ${folderId}
        ORDER BY m.created_at DESC
      `
    } else {
      // Get all files
      files = await sql`
        SELECT m.*, f.name as folder_name 
        FROM media m
        LEFT JOIN folders f ON m.folder_id = f.id
        WHERE m.user_id = ${user.id} AND m.is_active = true
        ORDER BY m.created_at DESC
      `
    }

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error("Media fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}
