import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"
import { del } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, fileIds, folderId } = body

    if (!action || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    // Verify all files belong to the user
    const userFiles = await sql`
      SELECT id, blob_url, thumbnail_url FROM media 
      WHERE id = ANY(${fileIds}) AND user_id = ${user.id} AND is_active = true
    `

    if (userFiles.length !== fileIds.length) {
      return NextResponse.json({ error: "Some files not found or unauthorized" }, { status: 404 })
    }

    switch (action) {
      case "delete":
        // Soft delete files in database
        await sql`
          UPDATE media 
          SET is_active = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY(${fileIds}) AND user_id = ${user.id}
        `

        // Delete from Vercel Blob (best effort)
        for (const file of userFiles) {
          try {
            if (file.blob_url) {
              await del(file.blob_url)
            }
            if (file.thumbnail_url) {
              await del(file.thumbnail_url)
            }
          } catch (blobError) {
            console.error("Error deleting from blob storage:", blobError)
            // Continue even if blob deletion fails
          }
        }

        return NextResponse.json({
          success: true,
          message: `${fileIds.length} file(s) deleted successfully`,
        })

      case "move":
        if (!folderId) {
          return NextResponse.json({ error: "Folder ID is required for move operation" }, { status: 400 })
        }

        // Verify folder exists and belongs to user
        const folder = await sql`
          SELECT id FROM folders 
          WHERE id = ${folderId} AND user_id = ${user.id} AND is_active = true
        `

        if (folder.length === 0) {
          return NextResponse.json({ error: "Folder not found" }, { status: 404 })
        }

        // Move files to folder
        await sql`
          UPDATE media 
          SET folder_id = ${folderId}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY(${fileIds}) AND user_id = ${user.id}
        `

        return NextResponse.json({
          success: true,
          message: `${fileIds.length} file(s) moved successfully`,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Bulk operation error:", error)
    return NextResponse.json({ error: "Failed to perform bulk operation" }, { status: 500 })
  }
}
