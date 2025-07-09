import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const result = await sql`
      SELECT 
        mf.*,
        COUNT(ma.id) as asset_count
      FROM media_folders mf
      LEFT JOIN media_assets ma ON mf.id = ma.folder_id
      WHERE mf.user_id = ${user.id}
      GROUP BY mf.id
      ORDER BY mf.created_at DESC
    `

    const folders = result.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      assetCount: Number.parseInt(folder.asset_count || "0"),
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
    }))

    return NextResponse.json({ folders })
  } catch (error) {
    console.error("Error fetching folders:", error)
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    // Check if folder name already exists for this user
    const existing = await sql`
      SELECT id FROM media_folders 
      WHERE user_id = ${user.id} AND name = ${name.trim()}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Folder name already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO media_folders (user_id, name, description)
      VALUES (${user.id}, ${name.trim()}, ${description || ""})
      RETURNING *
    `

    const folder = {
      id: result[0].id,
      name: result[0].name,
      description: result[0].description,
      assetCount: 0,
      createdAt: result[0].created_at,
      updatedAt: result[0].updated_at,
    }

    return NextResponse.json({
      message: "Folder created successfully",
      folder,
    })
  } catch (error) {
    console.error("Error creating folder:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("id")

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    // Check if folder has assets
    const assetCount = await sql`
      SELECT COUNT(*) as count
      FROM media_assets 
      WHERE folder_id = ${folderId} AND user_id = ${user.id}
    `

    if (Number.parseInt(assetCount[0].count) > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder with assets. Please move or delete assets first." },
        { status: 400 },
      )
    }

    // Delete folder
    await sql`
      DELETE FROM media_folders 
      WHERE id = ${folderId} AND user_id = ${user.id}
    `

    return NextResponse.json({
      message: "Folder deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}
