import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getMediaAssets, searchMediaAssets, deleteMediaAsset, moveMediaAsset } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const query = searchParams.get("query")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let assets
    if (query) {
      assets = await searchMediaAssets(user.id, query, limit)
    } else {
      assets = await getMediaAssets(user.id, folderId || undefined, limit, offset)
    }

    // Parse metadata JSON strings
    const assetsWithParsedMetadata = assets.map((asset) => ({
      ...asset,
      metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
    }))

    return NextResponse.json({ assets: assetsWithParsedMetadata })
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("id")

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 })
    }

    const deletedAsset = await deleteMediaAsset(assetId, user.id)
    if (!deletedAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting asset:", error)
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId, folderId } = await request.json()

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 })
    }

    const updatedAsset = await moveMediaAsset(assetId, folderId || null, user.id)
    if (!updatedAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      asset: {
        ...updatedAsset,
        metadata: typeof updatedAsset.metadata === "string" ? JSON.parse(updatedAsset.metadata) : updatedAsset.metadata,
      },
    })
  } catch (error) {
    console.error("Error updating asset:", error)
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}
