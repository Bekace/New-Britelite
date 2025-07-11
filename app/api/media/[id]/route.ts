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

    const { id } = params
    const body = await request.json()
    const { description, tags } = body

    const result = await sql`
      UPDATE media 
      SET 
        description = ${description || null},
        tags = ${tags || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

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
