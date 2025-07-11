import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get file info before deletion
    const fileResult = await sql`
      SELECT blob_url, thumbnail_url, filename
      FROM media 
      WHERE id = ${id} AND user_id = ${user.id}
    `

    if (fileResult.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = fileResult[0]

    // Delete from Vercel Blob
    try {
      await del(file.blob_url)
      if (file.thumbnail_url) {
        await del(file.thumbnail_url)
      }
    } catch (error) {
      console.error("Error deleting from blob storage:", error)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await sql`
      DELETE FROM media 
      WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const result = await sql`
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
      WHERE id = ${id} AND user_id = ${user.id} AND is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 })
  }
}
