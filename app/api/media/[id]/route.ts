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

    const fileId = params.id

    // Get file details first
    const fileResult = await sql`
      SELECT blob_url, thumbnail_url, user_id
      FROM media 
      WHERE id = ${fileId} AND is_active = true
    `

    if (fileResult.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = fileResult[0]

    // Check if user owns the file
    if (file.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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

    // Mark as inactive in database (soft delete)
    await sql`
      UPDATE media 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${fileId}
    `

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fileId = params.id
    const body = await request.json()
    const { description, tags } = body

    // Check if user owns the file
    const fileResult = await sql`
      SELECT user_id FROM media 
      WHERE id = ${fileId} AND is_active = true
    `

    if (fileResult.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (fileResult[0].user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update file metadata
    const result = await sql`
      UPDATE media 
      SET 
        description = ${description || null},
        tags = ${tags || []},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${fileId}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      file: result[0],
      message: "File updated successfully",
    })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
  }
}
