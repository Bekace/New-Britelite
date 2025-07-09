import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getCurrentUser } from "@/lib/auth"
import { createMediaAsset } from "@/lib/database"

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderId = formData.get("folderId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
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
          error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `${timestamp}-${randomString}.${fileExtension}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload original file to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    })

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined
    try {
      const thumbnailBuffer = await sharp(buffer).resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer()

      const thumbnailFilename = `thumb-${filename.replace(/\.[^/.]+$/, ".jpg")}`
      const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
        access: "public",
        contentType: "image/jpeg",
      })
      thumbnailUrl = thumbnailBlob.url
    } catch (error) {
      console.error("Error generating thumbnail:", error)
    }

    // Extract metadata
    let metadata = {}
    try {
      const imageMetadata = await sharp(buffer).metadata()
      metadata = {
        width: imageMetadata.width,
        height: imageMetadata.height,
        format: imageMetadata.format,
        density: imageMetadata.density,
      }
    } catch (error) {
      console.error("Error extracting metadata:", error)
    }

    // Save to database
    const asset = await createMediaAsset({
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
        metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload file",
      },
      { status: 500 },
    )
  }
}
