import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"
import sharp from "sharp"

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

    // Validate file size (3MB limit)
    const maxSize = 3 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 3MB limit" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "text/plain",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
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
    if (file.type.startsWith("image/")) {
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

        const thumbnailBlob = await put(`thumb-${filename}`, thumbnailBuffer, {
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
        ${file.type},
        ${file.size},
        ${file.type},
        ${blob.url},
        ${thumbnailUrl},
        ${width},
        ${height}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
