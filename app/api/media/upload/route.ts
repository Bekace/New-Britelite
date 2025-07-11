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
  "video/avi": "video",
  "video/mov": "video",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
  "text/plain": "document",
  "text/csv": "document",
  "application/rtf": "document",
}

// Function to generate video thumbnail using canvas
async function generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer | null> {
  try {
    // For video thumbnails, we'll create a simple placeholder image
    // In a real implementation, you'd use ffmpeg or similar
    const thumbnailBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.8 },
      },
    })
      .composite([
        {
          input: Buffer.from(`
          <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="#1f2937"/>
            <circle cx="150" cy="150" r="40" fill="white" opacity="0.9"/>
            <polygon points="135,130 135,170 175,150" fill="#1f2937"/>
          </svg>
        `),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer()

    return thumbnailBuffer
  } catch (error) {
    console.error("Error generating video thumbnail:", error)
    return null
  }
}

// Function to generate document thumbnail based on file type
async function generateDocumentThumbnail(mimeType: string): Promise<Buffer | null> {
  try {
    let iconSvg = ""
    let backgroundColor = "#f3f4f6"
    let iconColor = "#6b7280"

    // Determine icon and colors based on document type
    if (mimeType === "application/pdf") {
      backgroundColor = "#dc2626"
      iconColor = "white"
      iconSvg = `
        <text x="150" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${iconColor}">PDF</text>
        <rect x="100" y="140" width="100" height="80" fill="none" stroke="${iconColor}" stroke-width="2" rx="4"/>
        <line x1="110" y1="155" x2="180" y2="155" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="170" x2="180" y2="170" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="185" x2="160" y2="185" stroke="${iconColor}" stroke-width="1"/>
      `
    } else if (mimeType.includes("word") || mimeType.includes("msword")) {
      backgroundColor = "#2563eb"
      iconColor = "white"
      iconSvg = `
        <text x="150" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${iconColor}">DOC</text>
        <rect x="100" y="140" width="100" height="80" fill="none" stroke="${iconColor}" stroke-width="2" rx="4"/>
        <line x1="110" y1="155" x2="180" y2="155" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="170" x2="180" y2="170" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="185" x2="160" y2="185" stroke="${iconColor}" stroke-width="1"/>
      `
    } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      backgroundColor = "#16a34a"
      iconColor = "white"
      iconSvg = `
        <text x="150" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${iconColor}">XLS</text>
        <rect x="100" y="140" width="100" height="80" fill="none" stroke="${iconColor}" stroke-width="2" rx="4"/>
        <line x1="125" y1="140" x2="125" y2="220" stroke="${iconColor}" stroke-width="1"/>
        <line x1="175" y1="140" x2="175" y2="220" stroke="${iconColor}" stroke-width="1"/>
        <line x1="100" y1="165" x2="200" y2="165" stroke="${iconColor}" stroke-width="1"/>
        <line x1="100" y1="190" x2="200" y2="190" stroke="${iconColor}" stroke-width="1"/>
      `
    } else if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) {
      backgroundColor = "#ea580c"
      iconColor = "white"
      iconSvg = `
        <text x="150" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${iconColor}">PPT</text>
        <rect x="100" y="140" width="100" height="80" fill="none" stroke="${iconColor}" stroke-width="2" rx="4"/>
        <rect x="110" y="150" width="30" height="20" fill="${iconColor}" opacity="0.3"/>
        <rect x="150" y="150" width="40" height="15" fill="${iconColor}" opacity="0.3"/>
        <rect x="110" y="180" width="50" height="15" fill="${iconColor}" opacity="0.3"/>
        <rect x="110" y="200" width="35" height="10" fill="${iconColor}" opacity="0.3"/>
      `
    } else if (mimeType === "text/plain") {
      backgroundColor = "#64748b"
      iconColor = "white"
      iconSvg = `
        <text x="150" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${iconColor}">TXT</text>
        <rect x="100" y="140" width="100" height="80" fill="none" stroke="${iconColor}" stroke-width="2" rx="4"/>
        <line x1="110" y1="155" x2="180" y2="155" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="170" x2="180" y2="170" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="185" x2="160" y2="185" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="200" x2="170" y2="200" stroke="${iconColor}" stroke-width="1"/>
      `
    } else {
      // Generic document icon
      iconSvg = `
        <text x="150" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${iconColor}">DOC</text>
        <rect x="100" y="140" width="100" height="80" fill="none" stroke="${iconColor}" stroke-width="2" rx="4"/>
        <line x1="110" y1="155" x2="180" y2="155" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="170" x2="180" y2="170" stroke="${iconColor}" stroke-width="1"/>
        <line x1="110" y1="185" x2="160" y2="185" stroke="${iconColor}" stroke-width="1"/>
      `
    }

    const thumbnailBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: backgroundColor,
      },
    })
      .composite([
        {
          input: Buffer.from(`
          <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            ${iconSvg}
          </svg>
        `),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer()

    return thumbnailBuffer
  } catch (error) {
    console.error("Error generating document thumbnail:", error)
    return null
  }
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
    let duration: number | null = null

    // Generate thumbnail based on file type
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
        console.log("Upload API - Image thumbnail generated:", thumbnailUrl)
      } catch (error) {
        console.error("Error generating image thumbnail:", error)
      }
    } else if (fileType === "video") {
      try {
        const buffer = await file.arrayBuffer()
        const videoBuffer = Buffer.from(buffer)

        // Generate video thumbnail with play button
        const thumbnailBuffer = await generateVideoThumbnail(videoBuffer)

        if (thumbnailBuffer) {
          const thumbnailFilename = `thumb-${filename.replace(/\.[^/.]+$/, ".png")}`
          const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
            access: "public",
            contentType: "image/png",
          })

          thumbnailUrl = thumbnailBlob.url
          console.log("Upload API - Video thumbnail generated:", thumbnailUrl)
        }

        // For video dimensions and duration, we'd normally use ffprobe
        // For now, we'll set some default values
        width = 1920
        height = 1080
        duration = 0 // Duration in seconds - would be extracted with ffmpeg
      } catch (error) {
        console.error("Error processing video:", error)
      }
    } else if (fileType === "document") {
      try {
        // Generate document thumbnail based on MIME type
        const thumbnailBuffer = await generateDocumentThumbnail(file.type)

        if (thumbnailBuffer) {
          const thumbnailFilename = `thumb-${filename.replace(/\.[^/.]+$/, ".png")}`
          const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
            access: "public",
            contentType: "image/png",
          })

          thumbnailUrl = thumbnailBlob.url
          console.log("Upload API - Document thumbnail generated:", thumbnailUrl)
        }

        // Set standard document dimensions
        width = 210 // A4 width in mm (for reference)
        height = 297 // A4 height in mm (for reference)
      } catch (error) {
        console.error("Error processing document:", error)
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
        height,
        duration
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
        ${height},
        ${duration}
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
