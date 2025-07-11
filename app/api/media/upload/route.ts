import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"
import { put } from "@vercel/blob"
import sharp from "sharp"

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderId = formData.get("folderId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 3MB limit" }, { status: 400 })
    }

    // If folder_id is provided, verify it belongs to the user
    if (folderId && folderId !== "null") {
      const folder = await sql`
        SELECT id FROM folders 
        WHERE id = ${folderId} AND user_id = ${user.id} AND is_active = true
      `

      if (folder.length === 0) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 })
      }
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
    const timestamp = Date.now()
    const filename = `${user.id}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload main file
    const blob = await put(filename, fileBuffer, {
      access: "public",
      contentType: file.type,
    })

    // Determine file type
    let fileType = "document"
    if (file.type.startsWith("image/")) {
      fileType = "image"
    } else if (file.type.startsWith("video/")) {
      fileType = "video"
    }

    // Generate thumbnail for images
    let thumbnailUrl = null
    let width = null
    let height = null

    if (fileType === "image") {
      try {
        const image = sharp(fileBuffer)
        const metadata = await image.metadata()
        width = metadata.width
        height = metadata.height

        // Create thumbnail (max 300x300)
        const thumbnailBuffer = await image
          .resize(300, 300, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailFilename = `${user.id}/thumbnails/${timestamp}-thumb-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}.jpg`
        const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
          access: "public",
          contentType: "image/jpeg",
        })

        thumbnailUrl = thumbnailBlob.url
      } catch (error) {
        console.error("Thumbnail generation error:", error)
        // Continue without thumbnail
      }
    }

    // Save to database
    const result = await sql`
      INSERT INTO media (
        user_id, filename, original_filename, file_type, file_size, 
        mime_type, blob_url, thumbnail_url, width, height, folder_id
      )
      VALUES (
        ${user.id}, ${filename}, ${file.name}, ${fileType}, ${file.size},
        ${file.type}, ${blob.url}, ${thumbnailUrl}, ${width}, ${height}, 
        ${folderId && folderId !== "null" ? folderId : null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, file: result[0] })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
