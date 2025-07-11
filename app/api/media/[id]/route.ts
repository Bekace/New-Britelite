import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getUserFromSession } from "@/lib/auth"
import { del } from "@vercel/blob"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from session
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get the media file to check ownership and get blob URLs
    const mediaFile = await sql`
      SELECT blob_url, thumbnail_url, user_id
      FROM media 
      WHERE id = ${id} AND is_active = true
    `

    if (mediaFile.length === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Check if user owns the file
    if (mediaFile[0].user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete from Vercel Blob
    try {
      await del(mediaFile[0].blob_url)
      if (mediaFile[0].thumbnail_url) {
        await del(mediaFile[0].thumbnail_url)
      }
    } catch (error) {
      console.error("Error deleting from blob storage:", error)
    }

    // Mark as inactive in database (soft delete)
    await sql`
      UPDATE media 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Media file deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting media file:", error)
    return NextResponse.json({ error: "Failed to delete media file" }, { status: 500 })
  }
}
