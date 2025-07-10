import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth"
import { mediaQueries } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const fileType = searchParams.get("fileType")
    const search = searchParams.get("search")

    let assets
    if (search) {
      assets = await mediaQueries.searchAssets(user.id, search)
    } else {
      assets = await mediaQueries.getAssets(user.id, folderId || undefined, fileType || undefined)
    }

    return NextResponse.json({ assets })
  } catch (error) {
    console.error("Get assets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("id")
    const assetIds = searchParams.get("ids")?.split(",")

    if (assetIds && assetIds.length > 0) {
      // Bulk delete
      const deletedAssets = await mediaQueries.deleteMultipleAssets(assetIds, user.id)
      return NextResponse.json({
        message: `${deletedAssets.length} assets deleted successfully`,
        deletedAssets,
      })
    } else if (assetId) {
      // Single delete
      const deletedAsset = await mediaQueries.deleteAsset(assetId, user.id)
      if (!deletedAsset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 })
      }
      return NextResponse.json({ message: "Asset deleted successfully", deletedAsset })
    } else {
      return NextResponse.json({ error: "Asset ID(s) required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Delete assets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetIds, folderId } = await request.json()

    if (!assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json({ error: "Asset IDs are required" }, { status: 400 })
    }

    await mediaQueries.moveAssets(assetIds, folderId || null, user.id)

    return NextResponse.json({ message: "Assets moved successfully" })
  } catch (error) {
    console.error("Move assets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
