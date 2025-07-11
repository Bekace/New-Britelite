import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"
import { del } from "@vercel/blob"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const file = await sql`
      SELECT * FROM media 
      WHERE id = ${params.id} AND user_id = ${user.id} AND is_active = true
    `

    if (file.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, file: file[0] })
  } catch (error) {
    console.error("Media fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch media file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get file info before deletion
    const file = await sql`
      SELECT blob_url, thumbnail_url FROM media 
      WHERE id = ${params.id} AND user_id = ${user.id} AND is_active = true
    `

    if (file.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Soft delete in database
    await sql`
      UPDATE media 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id} AND user_id = ${user.id}
    `

    // Delete from Vercel Blob
    try {
      if (file[0].blob_url) {
        await del(file[0].blob_url)
      }
      if (file[0].thumbnail_url) {
        await del(file[0].thumbnail_url)
      }
    } catch (blobError) {
      console.error("Error deleting from blob storage:", blobError)
      // Continue even if blob deletion fails
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" })
  } catch (error) {
    console.error("Media deletion error:", error)
    return NextResponse.json({ error: "Failed to delete media file" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tags, description } = body

    // Update file metadata
    const result = await sql`
      UPDATE media 
      SET 
        tags = ${tags || null},
        description = ${description || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id} AND user_id = ${user.id} AND is_active = true
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, file: result[0] })
  } catch (error) {
    console.error("Media update error:", error)
    return NextResponse.json({ error: "Failed to update media file" }, { status: 500 })
  }
}
