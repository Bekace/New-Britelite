import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_TYPES = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "text/plain": "document",
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 3MB limit" }, { status: 400 })
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]
    if (!fileType) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()
    const filename = `${timestamp}-${randomString}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    let thumbnailUrl: string | null = null
    let width: number | null = null
    let height: number | null = null

    // Generate thumbnail for images
    if (fileType === "image") {
      try {
        const buffer = await file.arrayBuffer()
        const imageBuffer = Buffer.from(buffer)

        // Get image dimensions
        const metadata = await sharp(imageBuffer).metadata()
        width = metadata.width || null
        height = metadata.height || null

        // Generate thumbnail
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(300, 300, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailFilename = `thumb-${filename.replace(/\.[^/.]+$/, ".jpg")}`
        const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
          access: "public",
          contentType: "image/jpeg",
        })

        thumbnailUrl = thumbnailBlob.url
      } catch (error) {
        console.error("Error generating thumbnail:", error)
        // Continue without thumbnail if generation fails
      }
    }

    // Save to database
    const result = await sql`
      INSERT INTO media (
        user_id,
        filename,
        original_filename,
        file_type,
        file_size,
        mime_type,
        blob_url,
        thumbnail_url,
        width,
        height
      ) VALUES (
        ${user.id},
        ${filename},
        ${file.name},
        ${fileType},
        ${file.size},
        ${file.type},
        ${blob.url},
        ${thumbnailUrl},
        ${width},
        ${height}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      file: result[0],
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
