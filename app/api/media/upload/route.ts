import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries } from "@/lib/database"

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderId = formData.get("folderId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 3MB.",
        },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()
    const filename = `${user.id}/${timestamp}-${randomString}.${extension}`

    // Upload original file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const blob = await put(filename, fileBuffer, {
      access: "public",
      contentType: file.type,
    })

    // Generate thumbnail
    let thumbnailUrl = null
    try {
      const thumbnailBuffer = await sharp(fileBuffer)
        .resize(300, 300, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbnailFilename = `${user.id}/thumbnails/${timestamp}-${randomString}.jpg`
      const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
        access: "public",
        contentType: "image/jpeg",
      })
      thumbnailUrl = thumbnailBlob.url
    } catch (error) {
      console.error("Thumbnail generation failed:", error)
    }

    // Get image metadata
    let metadata = {}
    try {
      const imageMetadata = await sharp(fileBuffer).metadata()
      metadata = {
        width: imageMetadata.width,
        height: imageMetadata.height,
        format: imageMetadata.format,
        size: file.size,
      }
    } catch (error) {
      console.error("Metadata extraction failed:", error)
    }

    // Save to database
    const asset = await mediaQueries.createAsset({
      filename,
      original_filename: file.name,
      file_type: "image",
      file_size: file.size,
      mime_type: file.type,
      blob_url: blob.url,
      thumbnail_url: thumbnailUrl,
      folder_id: folderId || undefined,
      user_id: user.id,
      metadata,
    })

    return NextResponse.json({
      success: true,
      asset: {
        ...asset,
        url: asset.blob_url, // Add url field for compatibility
        metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed. Please try again.",
      },
      { status: 500 },
    )
  }
}
