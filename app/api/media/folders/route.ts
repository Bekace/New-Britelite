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
    const parentId = searchParams.get("parent_id")

    let whereClause = "WHERE mf.user_id = $1"
    const params: any[] = [user.id]

    if (parentId) {
      whereClause += " AND mf.parent_id = $2"
      params.push(parentId)
    } else {
      whereClause += " AND mf.parent_id IS NULL"
    }

    const query = `
      SELECT 
        mf.id,
        mf.name,
        mf.parent_id,
        mf.created_at,
        mf.updated_at,
        COUNT(ma.id) as asset_count
      FROM media_folders mf
      LEFT JOIN media_assets ma ON mf.id = ma.folder_id
      ${whereClause}
      GROUP BY mf.id, mf.name, mf.parent_id, mf.created_at, mf.updated_at
      ORDER BY mf.created_at DESC
    `

    const result = await sql.unsafe(query, params)

    const folders = result.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      parent_id: folder.parent_id,
      asset_count: Number.parseInt(folder.asset_count || "0"),
      created_at: folder.created_at,
      updated_at: folder.updated_at,
    }))

    return NextResponse.json({ folders })
  } catch (error) {
    console.error("Error fetching folders:", error)
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, parent_id } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    // Check if folder name already exists for this user at this level
    const existingQuery = parent_id
      ? `SELECT id FROM media_folders WHERE user_id = $1 AND name = $2 AND parent_id = $3`
      : `SELECT id FROM media_folders WHERE user_id = $1 AND name = $2 AND parent_id IS NULL`

    const existingParams = parent_id ? [user.id, name.trim(), parent_id] : [user.id, name.trim()]
    const existing = await sql.unsafe(existingQuery, existingParams)

    if (existing.length > 0) {
      return NextResponse.json({ error: "Folder name already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO media_folders (user_id, name, parent_id)
      VALUES (${user.id}, ${name.trim()}, ${parent_id || null})
      RETURNING id, name, parent_id, created_at, updated_at
    `

    const folder = {
      id: result[0].id,
      name: result[0].name,
      parent_id: result[0].parent_id,
      asset_count: 0,
      created_at: result[0].created_at,
      updated_at: result[0].updated_at,
    }

    return NextResponse.json({ success: true, folder })
  } catch (error) {
    console.error("Error creating folder:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    return NextResponse.json({ success: true, message: "Folder deleted successfully" })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}
