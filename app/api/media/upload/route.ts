import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries } from "@/lib/database"

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

    // Upload original file to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined
    try {
      const buffer = await file.arrayBuffer()
      const thumbnailBuffer = await sharp(Buffer.from(buffer))
        .resize(300, 300, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbnailBlob = await put(`thumb-${filename}`, thumbnailBuffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/jpeg",
      })
      thumbnailUrl = thumbnailBlob.url
    } catch (error) {
      console.error("Thumbnail generation failed:", error)
    }

    // Extract metadata
    const metadata = {
      width: 0,
      height: 0,
      format: file.type,
    }

    try {
      const buffer = await file.arrayBuffer()
      const imageMetadata = await sharp(Buffer.from(buffer)).metadata()
      metadata.width = imageMetadata.width || 0
      metadata.height = imageMetadata.height || 0
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
      asset,
      message: "File uploaded successfully",
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
