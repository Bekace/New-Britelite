import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries, systemQueries } from "@/lib/database"
import sharp from "sharp"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

const MAX_FILE_SIZE_DEFAULT = 3 * 1024 * 1024 // 3MB in bytes

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderId = formData.get("folderId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get max file size from system settings
    const maxFileSizeMB = await systemQueries.getSetting("max_file_size_mb")
    const maxFileSize = maxFileSizeMB ? Number.parseInt(maxFileSizeMB) * 1024 * 1024 : MAX_FILE_SIZE_DEFAULT

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum limit of ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        },
        { status: 400 },
      )
    }

    // Validate file type (Phase 1: Images only)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Only image files (JPEG, PNG, GIF, WebP) are supported in this phase",
        },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `${user.id}/${timestamp}-${randomString}.${fileExtension}`

    // Upload original file to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      try {
        const buffer = await file.arrayBuffer()
        const thumbnailBuffer = await sharp(Buffer.from(buffer))
          .resize(300, 300, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailBlob = new Blob([thumbnailBuffer], { type: "image/jpeg" })
        const thumbnailFilename = `${user.id}/thumbnails/${timestamp}-${randomString}.jpg`

        const thumbnailUpload = await put(thumbnailFilename, thumbnailBlob, {
          access: "public",
        })

        thumbnailUrl = thumbnailUpload.url
      } catch (error) {
        console.error("Error generating thumbnail:", error)
        // Continue without thumbnail if generation fails
      }
    }

    // Get image metadata
    let metadata = {}
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      try {
        const buffer = await file.arrayBuffer()
        const imageInfo = await sharp(Buffer.from(buffer)).metadata()
        metadata = {
          width: imageInfo.width,
          height: imageInfo.height,
          format: imageInfo.format,
          hasAlpha: imageInfo.hasAlpha,
        }
      } catch (error) {
        console.error("Error extracting image metadata:", error)
      }
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
      folder_id: folderId || null,
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
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
