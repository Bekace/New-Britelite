import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folders = await sql`
      SELECT f.*, 
             COUNT(m.id) as file_count
      FROM folders f
      LEFT JOIN media m ON f.id = m.folder_id AND m.is_active = true
      WHERE f.user_id = ${user.id} AND f.is_active = true
      GROUP BY f.id, f.name, f.description, f.parent_id, f.created_at, f.updated_at
      ORDER BY f.name ASC
    `

    return NextResponse.json({ success: true, folders })
  } catch (error) {
    console.error("Folders fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, parent_id } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    // Check if folder name already exists for this user
    const existingFolder = await sql`
      SELECT id FROM folders 
      WHERE user_id = ${user.id} 
      AND name = ${name.trim()} 
      AND parent_id ${parent_id ? `= ${parent_id}` : "IS NULL"}
      AND is_active = true
    `

    if (existingFolder.length > 0) {
      return NextResponse.json({ error: "Folder name already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO folders (user_id, name, description, parent_id)
      VALUES (${user.id}, ${name.trim()}, ${description?.trim() || null}, ${parent_id || null})
      RETURNING *
    `

    return NextResponse.json({ success: true, folder: result[0] })
  } catch (error) {
    console.error("Folder creation error:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}
