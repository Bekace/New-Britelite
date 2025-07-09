import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"
import { getMediaAssets, deleteMediaAsset, moveMediaAssets } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const search = searchParams.get("search")

    const assets = await getMediaAssets(user.id, folderId || undefined, search || undefined)

    return NextResponse.json({ assets })
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

    const { assetIds } = await request.json()

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ error: "Invalid asset IDs" }, { status: 400 })
    }

    // Delete each asset and its blob files
    for (const assetId of assetIds) {
      const asset = await deleteMediaAsset(assetId, user.id)
      if (asset) {
        // Delete from Vercel Blob
        try {
          await del(asset.blob_url)
          if (asset.thumbnail_url) {
            await del(asset.thumbnail_url)
          }
        } catch (error) {
          console.error("Error deleting blob files:", error)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting assets:", error)
    return NextResponse.json({ error: "Failed to delete assets" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetIds, folderId } = await request.json()

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ error: "Invalid asset IDs" }, { status: 400 })
    }

    await moveMediaAssets(assetIds, folderId || null, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error moving assets:", error)
    return NextResponse.json({ error: "Failed to move assets" }, { status: 500 })
  }
}
