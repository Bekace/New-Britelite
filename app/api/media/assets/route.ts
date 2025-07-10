import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folder_id")
    const search = searchParams.get("search")

    let query = `
      SELECT 
        id,
        filename,
        original_filename,
        file_type,
        file_size,
        blob_url as url,
        thumbnail_url,
        folder_id,
        metadata,
        created_at,
        updated_at
      FROM media_assets 
      WHERE user_id = $1
    `
    const params: any[] = [user.id]

    if (folderId) {
      query += ` AND folder_id = $2`
      params.push(folderId)
    } else {
      query += ` AND folder_id IS NULL`
    }

    if (search) {
      const searchIndex = params.length + 1
      query += ` AND (original_filename ILIKE $${searchIndex} OR filename ILIKE $${searchIndex})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY created_at DESC`

    const result = await sql.unsafe(query, params)

    const assets = result.map((asset: any) => ({
      id: asset.id,
      filename: asset.filename,
      original_filename: asset.original_filename,
      file_type: asset.file_type,
      file_size: asset.file_size,
      url: asset.url,
      thumbnail_url: asset.thumbnail_url,
      folder_id: asset.folder_id,
      created_at: asset.created_at,
      metadata: asset.metadata
        ? typeof asset.metadata === "string"
          ? JSON.parse(asset.metadata)
          : asset.metadata
        : null,
    }))

    return NextResponse.json({ assets })
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get("ids")?.split(",") || []

    if (ids.length === 0) {
      return NextResponse.json({ error: "No asset IDs provided" }, { status: 400 })
    }

    await sql`
      DELETE FROM media_assets 
      WHERE id = ANY(${ids}) AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting assets:", error)
    return NextResponse.json({ error: "Failed to delete assets" }, { status: 500 })
  }
}
