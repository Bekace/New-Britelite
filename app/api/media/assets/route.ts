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
    const fileType = searchParams.get("fileType")

    const assets = await mediaQueries.getAssets(
      user.id,
      folderId === "null" ? null : folderId || undefined,
      fileType || undefined,
    )

    return NextResponse.json({ assets })
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

    const { assetIds } = await request.json()

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ error: "No asset IDs provided" }, { status: 400 })
    }

    // Get asset URLs before deletion for cleanup
    const deletedAssets = await mediaQueries.deleteMultipleAssets(assetIds, user.id)

    // Clean up blob storage
    for (const asset of deletedAssets) {
      try {
        if (asset.blob_url) {
          await del(asset.blob_url)
        }
        if (asset.thumbnail_url) {
          await del(asset.thumbnail_url)
        }
      } catch (error) {
        console.error("Error deleting blob:", error)
        // Continue with other deletions even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedAssets.length,
    })
  } catch (error) {
    console.error("Error deleting assets:", error)
    return NextResponse.json({ error: "Failed to delete assets" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetIds, folderId } = await request.json()

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ error: "No asset IDs provided" }, { status: 400 })
    }

    await mediaQueries.moveAssets(assetIds, folderId || null, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error moving assets:", error)
    return NextResponse.json({ error: "Failed to move assets" }, { status: 500 })
  }
}
