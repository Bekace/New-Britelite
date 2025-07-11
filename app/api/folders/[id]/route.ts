import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    // Check if folder exists and belongs to user
    const existingFolder = await sql`
      SELECT * FROM folders 
      WHERE id = ${params.id} AND user_id = ${user.id} AND is_active = true
    `

    if (existingFolder.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Check if new name conflicts with existing folders
    const nameConflict = await sql`
      SELECT id FROM folders 
      WHERE user_id = ${user.id} 
      AND name = ${name.trim()} 
      AND id != ${params.id}
      AND parent_id ${existingFolder[0].parent_id ? `= ${existingFolder[0].parent_id}` : "IS NULL"}
      AND is_active = true
    `

    if (nameConflict.length > 0) {
      return NextResponse.json({ error: "Folder name already exists" }, { status: 400 })
    }

    const result = await sql`
      UPDATE folders 
      SET name = ${name.trim()}, 
          description = ${description?.trim() || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({ success: true, folder: result[0] })
  } catch (error) {
    console.error("Folder update error:", error)
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if folder exists and belongs to user
    const folder = await sql`
      SELECT * FROM folders 
      WHERE id = ${params.id} AND user_id = ${user.id} AND is_active = true
    `

    if (folder.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Prevent deletion of "Uncategorized" folder
    if (folder[0].name === "Uncategorized") {
      return NextResponse.json({ error: "Cannot delete the Uncategorized folder" }, { status: 400 })
    }

    // Get or create "Uncategorized" folder for this user
    let uncategorizedFolder = await sql`
      SELECT id FROM folders 
      WHERE user_id = ${user.id} AND name = 'Uncategorized' AND is_active = true
    `

    if (uncategorizedFolder.length === 0) {
      const newUncategorized = await sql`
        INSERT INTO folders (user_id, name, description)
        VALUES (${user.id}, 'Uncategorized', 'Default folder for uncategorized files')
        RETURNING id
      `
      uncategorizedFolder = newUncategorized
    }

    // Move all files from this folder to "Uncategorized"
    await sql`
      UPDATE media 
      SET folder_id = ${uncategorizedFolder[0].id}, updated_at = CURRENT_TIMESTAMP
      WHERE folder_id = ${params.id} AND user_id = ${user.id}
    `

    // Soft delete the folder
    await sql`
      UPDATE folders 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true, message: "Folder deleted successfully" })
  } catch (error) {
    console.error("Folder deletion error:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}
