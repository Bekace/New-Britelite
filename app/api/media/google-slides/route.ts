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
    const { url, folderId } = body

    if (!url || !url.includes("docs.google.com/presentation")) {
      return NextResponse.json({ error: "Invalid Google Slides URL" }, { status: 400 })
    }

    // If folder_id is provided, verify it belongs to the user
    if (folderId && folderId !== "null") {
      const folder = await sql`
        SELECT id FROM folders 
        WHERE id = ${folderId} AND user_id = ${user.id} AND is_active = true
      `

      if (folder.length === 0) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 })
      }
    }

    // Extract presentation ID from URL
    let presentationId = ""
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

    // Generate embed URL with minimal toolbar
    const embedUrl = `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000&rm=minimal`

    // Extract title from URL or use default
    let title = "Google Slides Presentation"
    try {
      // Try to extract title from URL parameters or use default
      const urlObj = new URL(url)
      const titleMatch = url.match(/\/presentation\/d\/[^/]+\/edit#slide=id\.([^&]+)/)
      if (titleMatch) {
        title = `Google Slides - ${titleMatch[1]}`
      }
    } catch (error) {
      // Use default title
    }

    // Save to database
    const result = await sql`
      INSERT INTO media (
        user_id, filename, original_filename, file_type, file_size, 
        mime_type, blob_url, google_slides_url, embed_url, folder_id
      )
      VALUES (
        ${user.id}, ${`google-slides-${presentationId}`}, ${title}, 
        'google-slides', 0, 'application/vnd.google-apps.presentation',
        ${url}, ${url}, ${embedUrl}, 
        ${folderId && folderId !== "null" ? folderId : null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, file: result[0] })
  } catch (error) {
    console.error("Google Slides error:", error)
    return NextResponse.json({ error: "Failed to add Google Slides" }, { status: 500 })
  }
}
