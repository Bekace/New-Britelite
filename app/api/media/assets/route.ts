import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const search = searchParams.get("search")

    const assets = await mediaQueries.getAssets({
      userId: user.id,
      folderId: folderId || undefined,
      search: search || undefined,
    })

    // Add url field for compatibility
    const assetsWithUrl = assets.map((asset) => ({
      ...asset,
      url: asset.blob_url,
      metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
    }))

    return NextResponse.json({ assets: assetsWithUrl })
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

    // Delete assets
    for (const id of ids) {
      await mediaQueries.deleteAsset(id, user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting assets:", error)
    return NextResponse.json({ error: "Failed to delete assets" }, { status: 500 })
  }
}
