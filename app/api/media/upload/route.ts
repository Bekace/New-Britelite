import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const folderId = formData.get("folderId") as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedAssets = []

    for (const file of files) {
      if (!file.name || file.size === 0) {
        continue
      }

      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: "public",
      })

      // Save to database
      const result = await sql`
        INSERT INTO media_assets (
          user_id, folder_id, filename, original_filename, file_size, 
          mime_type, storage_url, storage_key
        ) VALUES (
          ${user.id}, ${folderId}, ${blob.pathname}, ${file.name}, 
          ${file.size}, ${file.type}, ${blob.url}, ${blob.pathname}
        )
        RETURNING *
      `

      uploadedAssets.push({
        id: result[0].id,
        filename: result[0].filename,
        originalFilename: result[0].original_filename,
        fileSize: result[0].file_size,
        mimeType: result[0].mime_type,
        storageUrl: result[0].storage_url,
        createdAt: result[0].created_at,
      })
    }

    return NextResponse.json({
      message: "Files uploaded successfully",
      assets: uploadedAssets,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
