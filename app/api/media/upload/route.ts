import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql } from "@/lib/database"
import { sessionQueries } from "@/lib/database"
import sharp from "sharp"

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/mov",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 3MB limit" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `${timestamp}-${randomString}.${fileExtension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    let thumbnailUrl: string | null = null
    let width: number | null = null
    let height: number | null = null

    // Generate thumbnail for images
    if (file.type.startsWith("image/")) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const metadata = await sharp(buffer).metadata()
        width = metadata.width || null
        height = metadata.height || null

        // Create thumbnail
        const thumbnailBuffer = await sharp(buffer).resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer()

        const thumbnailFilename = `thumb-${filename.replace(/\.[^/.]+$/, ".jpg")}`
        const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
          access: "public",
        })
        thumbnailUrl = thumbnailBlob.url
      } catch (error) {
        console.error("Error generating thumbnail:", error)
      }
    }

    // Determine file type category
    let fileType = "document"
    if (file.type.startsWith("image/")) fileType = "image"
    else if (file.type.startsWith("video/")) fileType = "video"

    // Save to database
    const mediaRecord = await sql`
      INSERT INTO media (
        user_id, filename, original_filename, file_type, file_size,
        mime_type, blob_url, thumbnail_url, width, height
      ) VALUES (
        ${session.id}, ${filename}, ${file.name}, ${fileType}, ${file.size},
        ${file.type}, ${blob.url}, ${thumbnailUrl}, ${width}, ${height}
      )
      RETURNING id, filename, original_filename, file_type, file_size, mime_type,
               blob_url, thumbnail_url, width, height, created_at
    `

    return NextResponse.json({
      success: true,
      media: mediaRecord[0],
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
