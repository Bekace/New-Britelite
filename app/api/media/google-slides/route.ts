import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url || !url.includes("docs.google.com/presentation")) {
      return NextResponse.json({ error: "Invalid Google Slides URL" }, { status: 400 })
    }

    // Extract presentation ID from various Google Slides URL formats
    let presentationId = ""

    // Handle different URL formats
    const patterns = [
      /\/presentation\/d\/([a-zA-Z0-9-_]+)/,
      /\/presentation\/d\/([a-zA-Z0-9-_]+)\/edit/,
      /\/presentation\/d\/([a-zA-Z0-9-_]+)\/view/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        presentationId = match[1]
        break
      }
    }

    if (!presentationId) {
      return NextResponse.json({ error: "Could not extract presentation ID from URL" }, { status: 400 })
    }

    // Create embed URL without toolbar
    const embedUrl = `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000&rm=minimal`

    // Generate filename from URL or use default
    const filename = `google-slides-${presentationId}`
    const originalFilename = `Google Slides Presentation`

    // Insert into database
    const result = await sql`
      INSERT INTO media (
        user_id,
        filename,
        original_filename,
        file_type,
        file_size,
        mime_type,
        blob_url,
        google_slides_url,
        embed_url,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${user.id},
        ${filename},
        ${originalFilename},
        'google-slides',
        0,
        'application/vnd.google-apps.presentation',
        ${url},
        ${url},
        ${embedUrl},
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      file: result[0],
      message: "Google Slides added successfully",
    })
  } catch (error) {
    console.error("Google Slides upload error:", error)
    return NextResponse.json({ error: "Failed to add Google Slides" }, { status: 500 })
  }
}
