import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")

    const folders = await mediaQueries.getFolders(user.id, parentId || undefined)

    return NextResponse.json({ folders })
  } catch (error) {
    console.error("Get folders error:", error)
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, parentId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    const folder = await mediaQueries.createFolder({
      name: name.trim(),
      parent_id: parentId || undefined,
      user_id: user.id,
    })

    return NextResponse.json({ folder })
  } catch (error) {
    console.error("Create folder error:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("id")

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    await mediaQueries.deleteFolder(folderId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete folder error:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}
