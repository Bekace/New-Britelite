import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const search = searchParams.get("search")

    let assets
    if (search) {
      assets = await mediaQueries.searchAssets(user.id, search)
    } else {
      assets = await mediaQueries.getAssets(user.id, folderId || undefined)
    }

    return NextResponse.json({ assets })
  } catch (error) {
    console.error("Get assets error:", error)
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
    const assetIds = searchParams.get("ids")?.split(",")

    if (assetIds && assetIds.length > 0) {
      // Bulk delete
      const deletedAssets = await mediaQueries.deleteMultipleAssets(assetIds, user.id)

      // Delete from Vercel Blob
      for (const asset of deletedAssets) {
        try {
          if (asset.blob_url) await del(asset.blob_url)
          if (asset.thumbnail_url) await del(asset.thumbnail_url)
        } catch (error) {
          console.error("Error deleting from blob:", error)
        }
      }

      return NextResponse.json({ success: true, deletedCount: deletedAssets.length })
    } else if (assetId) {
      // Single delete
      const deletedAsset = await mediaQueries.deleteAsset(assetId, user.id)

      if (deletedAsset) {
        // Delete from Vercel Blob
        try {
          if (deletedAsset.blob_url) await del(deletedAsset.blob_url)
          if (deletedAsset.thumbnail_url) await del(deletedAsset.thumbnail_url)
        } catch (error) {
          console.error("Error deleting from blob:", error)
        }
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "No asset ID provided" }, { status: 400 })
    }
  } catch (error) {
    console.error("Delete asset error:", error)
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { assetIds, folderId } = body

    if (!assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json({ error: "Invalid asset IDs" }, { status: 400 })
    }

    await mediaQueries.moveAssets(assetIds, folderId || null, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Move assets error:", error)
    return NextResponse.json({ error: "Failed to move assets" }, { status: 500 })
  }
}
