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
      SELECT blob_url, thumbnail_url, original_filename
      FROM media 
      WHERE id = ${fileId} AND user_id = ${user.id}
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
    } catch (blobError) {
      console.error("Error deleting from blob storage:", blobError)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await sql`
      DELETE FROM media 
      WHERE id = ${fileId} AND user_id = ${user.id}
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
