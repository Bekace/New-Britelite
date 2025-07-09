import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { mediaQueries } from "@/lib/database"
import { del } from "@vercel/blob"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const search = searchParams.get("search")

    const assets = await mediaQueries.getAssets(user.id, folderId || undefined, search || undefined)

    // Parse metadata for each asset
    const assetsWithParsedMetadata = assets.map((asset) => ({
      ...asset,
      metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
    }))

    return NextResponse.json({ assets: assetsWithParsedMetadata })
  } catch (error) {
    console.error("Get assets error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch assets",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetIds = searchParams.get("ids")?.split(",") || []

    if (assetIds.length === 0) {
      return NextResponse.json({ error: "No asset IDs provided" }, { status: 400 })
    }

    const deletedAssets = []
    for (const assetId of assetIds) {
      const asset = await mediaQueries.deleteAsset(assetId, user.id)
      if (asset) {
        // Delete from Vercel Blob
        try {
          await del(asset.blob_url)
          if (asset.thumbnail_url) {
            await del(asset.thumbnail_url)
          }
        } catch (error) {
          console.error("Failed to delete blob:", error)
        }
        deletedAssets.push(asset)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedAssets.length,
    })
  } catch (error) {
    console.error("Delete assets error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete assets",
      },
      { status: 500 },
    )
  }
}
