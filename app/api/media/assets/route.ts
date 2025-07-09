import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const folderId = searchParams.get("folderId")
    const search = searchParams.get("search")
    const type = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        ma.*,
        mf.name as folder_name
      FROM media_assets ma
      LEFT JOIN media_folders mf ON ma.folder_id = mf.id
      WHERE ma.user_id = $1
    `
    const params: any[] = [user.id]
    let paramIndex = 2

    if (folderId) {
      query += ` AND ma.folder_id = $${paramIndex}`
      params.push(folderId)
      paramIndex++
    }

    if (search) {
      query += ` AND (ma.filename ILIKE $${paramIndex} OR ma.original_filename ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (type) {
      query += ` AND ma.mime_type LIKE $${paramIndex}`
      params.push(`${type}/%`)
      paramIndex++
    }

    query += ` ORDER BY ma.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await sql.unsafe(query, params)

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM media_assets ma
      WHERE ma.user_id = $1
    `
    const countParams: any[] = [user.id]
    let countParamIndex = 2

    if (folderId) {
      countQuery += ` AND ma.folder_id = $${countParamIndex}`
      countParams.push(folderId)
      countParamIndex++
    }

    if (search) {
      countQuery += ` AND (ma.filename ILIKE $${countParamIndex} OR ma.original_filename ILIKE $${countParamIndex})`
      countParams.push(`%${search}%`)
      countParamIndex++
    }

    if (type) {
      countQuery += ` AND ma.mime_type LIKE $${countParamIndex}`
      countParams.push(`${type}/%`)
    }

    const countResult = await sql.unsafe(countQuery, countParams)
    const total = Number.parseInt(countResult[0].total)

    const assets = result.map((asset: any) => ({
      id: asset.id,
      filename: asset.filename,
      originalFilename: asset.original_filename,
      fileSize: asset.file_size,
      mimeType: asset.mime_type,
      storageUrl: asset.storage_url,
      folderId: asset.folder_id,
      folderName: asset.folder_name,
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
    }))

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const assetIds = searchParams.get("ids")?.split(",") || []

    if (assetIds.length === 0) {
      return NextResponse.json({ error: "No asset IDs provided" }, { status: 400 })
    }

    // Delete from database
    await sql`
      DELETE FROM media_assets 
      WHERE id = ANY(${assetIds}) AND user_id = ${user.id}
    `

    return NextResponse.json({
      message: "Assets deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting assets:", error)
    return NextResponse.json({ error: "Failed to delete assets" }, { status: 500 })
  }
}
