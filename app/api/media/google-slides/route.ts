import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

// Function to extract presentation ID from Google Slides URL
function extractPresentationId(url: string): string | null {
  const patterns = [
    /\/presentation\/d\/([a-zA-Z0-9-_]+)/,
    /\/presentation\/d\/([a-zA-Z0-9-_]+)\/edit/,
    /\/presentation\/d\/([a-zA-Z0-9-_]+)\/view/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

// Function to generate Google Slides embed URL without toolbar
function generateEmbedUrl(presentationId: string): string {
  return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000&rm=minimal`
}

// Function to generate Google Slides thumbnail
async function generateGoogleSlidesThumbnail(): Promise<Buffer> {
  const thumbnailBuffer = await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 4,
      background: { r: 255, g: 165, b: 0, alpha: 1 }, // Orange background
    },
  })
    .composite([
      {
        input: Buffer.from(`
        <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="300" fill="#ff6600"/>
          <rect x="50" y="80" width="200" height="140" fill="white" rx="8"/>
          <rect x="70" y="100" width="60" height="40" fill="#ff6600" opacity="0.3" rx="4"/>
          <rect x="140" y="100" width="80" height="20" fill="#ff6600" opacity="0.3" rx="2"/>
          <rect x="140" y="130" width="60" height="10" fill="#ff6600" opacity="0.3" rx="2"/>
          <rect x="70" y="160" width="100" height="15" fill="#ff6600" opacity="0.3" rx="2"/>
          <rect x="70" y="185" width="80" height="15" fill="#ff6600" opacity="0.3" rx="2"/>
          <text x="150" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">Google Slides</text>
        </svg>
      `),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()

  return thumbnailBuffer
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate Google Slides URL
    if (!url.includes("docs.google.com/presentation")) {
      return NextResponse.json({ error: "Invalid Google Slides URL" }, { status: 400 })
    }

    // Extract presentation ID
    const presentationId = extractPresentationId(url)
    if (!presentationId) {
      return NextResponse.json({ error: "Could not extract presentation ID from URL" }, { status: 400 })
    }

    // Generate embed URL without toolbar
    const embedUrl = generateEmbedUrl(presentationId)

    // Generate a filename based on the presentation ID
    const filename = `google-slides-${presentationId}`
    const originalFilename = `Google Slides - ${presentationId.substring(0, 8)}`

    // Generate thumbnail
    let thumbnailUrl: string | null = null
    try {
      const thumbnailBuffer = await generateGoogleSlidesThumbnail()
      const thumbnailFilename = `thumb-${filename}.png`
      const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
        access: "public",
        contentType: "image/png",
      })
      thumbnailUrl = thumbnailBlob.url
    } catch (error) {
      console.error("Error generating Google Slides thumbnail:", error)
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
        google_slides_url,
        embed_url
      ) VALUES (
        ${user.id},
        ${filename},
        ${originalFilename},
        'google-slides',
        0,
        'application/vnd.google-apps.presentation',
        ${url},
        ${thumbnailUrl},
        1920,
        1080,
        ${url},
        ${embedUrl}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      file: result[0],
      message: "Google Slides added successfully",
    })
  } catch (error) {
    console.error("Google Slides error:", error)
    return NextResponse.json(
      {
        error: "Failed to add Google Slides",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
