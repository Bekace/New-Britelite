import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries, systemQueries } from "@/lib/database"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB default

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

    // Get configurable file size limit
    const maxFileSizeMB = await systemQueries.getSetting("max_file_size_mb")
    const maxFileSize = maxFileSizeMB ? Number.parseInt(maxFileSizeMB) * 1024 * 1024 : MAX_FILE_SIZE

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds ${Math.floor(maxFileSize / 1024 / 1024)}MB limit` },
        { status: 400 },
      )
    }

    // Validate file type (Phase 1: Images only)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, GIF, WebP) are supported in Phase 1" },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `${user.id}/${timestamp}-${randomString}.${fileExtension}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload original file to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    })

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      try {
        const thumbnailBuffer = await sharp(buffer)
          .resize(300, 300, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailFilename = `${user.id}/thumbnails/${timestamp}-${randomString}.jpg`
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

    // Extract metadata
    let metadata: any = {}
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      try {
        const imageMetadata = await sharp(buffer).metadata()
        metadata = {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
          density: imageMetadata.density,
          hasAlpha: imageMetadata.hasAlpha,
        }
      } catch (error) {
        console.error("Error extracting metadata:", error)
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
      folder_id: folderId || undefined,
      user_id: user.id,
      metadata,
    })

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        filename: asset.filename,
        original_filename: asset.original_filename,
        file_type: asset.file_type,
        file_size: asset.file_size,
        mime_type: asset.mime_type,
        blob_url: asset.blob_url,
        thumbnail_url: asset.thumbnail_url,
        metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
        created_at: asset.created_at,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
