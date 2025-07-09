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
    const folderId = searchParams.get("folderId")
    const search = searchParams.get("search")

    let assets
    if (search) {
      assets = await mediaQueries.searchAssets(user.id, search)
    } else {
      assets = await mediaQueries.getAssetsByUser(user.id, folderId || undefined)
    }

    return NextResponse.json({ assets })
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
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetIds } = await request.json()

    if (!assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json({ error: "Invalid asset IDs" }, { status: 400 })
    }

    await mediaQueries.deleteMultipleAssets(assetIds, user.id)

    return NextResponse.json({
      success: true,
      message: "Assets deleted successfully",
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

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetIds, folderId } = await request.json()

    if (!assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json({ error: "Invalid asset IDs" }, { status: 400 })
    }

    await mediaQueries.moveAssets(assetIds, folderId || null, user.id)

    return NextResponse.json({
      success: true,
      message: "Assets moved successfully",
    })
  } catch (error) {
    console.error("Move assets error:", error)
    return NextResponse.json(
      {
        error: "Failed to move assets",
      },
      { status: 500 },
    )
  }
}
