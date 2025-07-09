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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 3MB limit" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `${timestamp}-${randomString}.${fileExtension}`

    // Upload original file to Vercel Blob
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const blob = await put(filename, fileBuffer, {
      access: "public",
      contentType: file.type,
    })

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined
    try {
      const thumbnailBuffer = await sharp(fileBuffer)
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
    }

    // Extract metadata
    let metadata: any = {}
    try {
      const imageMetadata = await sharp(fileBuffer).metadata()
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
      originalFilename: file.name,
      fileType: "image",
      fileSize: file.size,
      mimeType: file.type,
      blobUrl: blob.url,
      thumbnailUrl,
      folderId: folderId || undefined,
      userId: user.id,
      metadata,
    })

    return NextResponse.json({ asset })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
