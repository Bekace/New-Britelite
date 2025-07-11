import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { sql } from "@/lib/database"
import { sessionQueries } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify session and get user
    const session = await sessionQueries.findByToken(sessionToken)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const mediaId = params.id

    // Get media file details
    const mediaFile = await sql`
      SELECT blob_url, thumbnail_url, filename
      FROM media 
      WHERE id = ${mediaId} AND user_id = ${session.id}
    `

    if (mediaFile.length === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    const file = mediaFile[0]

    // Delete from Vercel Blob
    try {
      await del(file.blob_url)
      if (file.thumbnail_url) {
        await del(file.thumbnail_url)
      }
    } catch (error) {
      console.error("Error deleting from blob storage:", error)
    }

    // Delete from database
    await sql`
      DELETE FROM media 
      WHERE id = ${mediaId} AND user_id = ${session.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media file:", error)
    return NextResponse.json({ error: "Failed to delete media file" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify session and get user
    const session = await sessionQueries.findByToken(sessionToken)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const mediaId = params.id
    const body = await request.json()
    const { description, tags } = body

    // Update media file
    const updatedMedia = await sql`
      UPDATE media 
      SET 
        description = ${description || null},
        tags = ${tags ? JSON.stringify(tags) : null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${mediaId} AND user_id = ${session.id}
      RETURNING id, filename, original_filename, file_type, file_size, mime_type,
               blob_url, thumbnail_url, width, height, tags, description,
               is_active, created_at, updated_at
    `

    if (updatedMedia.length === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      media: updatedMedia[0],
    })
  } catch (error) {
    console.error("Error updating media file:", error)
    return NextResponse.json({ error: "Failed to update media file" }, { status: 500 })
  }
}
