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
    console.log("Upload API - Starting request")

    const user = await getUserFromSession(request)
    console.log("Upload API - User from session:", !!user)

    if (!user) {
      console.log("Upload API - No user found, returning 401")
      return NextResponse.json({ error: "Unauthorized - No valid session found" }, { status: 401 })
    }

    console.log("Upload API - Processing file upload for user:", user.id)

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("Upload API - File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

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

    console.log("Upload API - Generated filename:", filename)

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    console.log("Upload API - Blob uploaded:", blob.url)

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
        console.log("Upload API - Thumbnail generated:", thumbnailUrl)
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

    console.log("Upload API - File saved to database:", result[0].id)

    return NextResponse.json({
      success: true,
      file: result[0],
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
