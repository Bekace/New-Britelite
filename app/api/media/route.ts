import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const files = await sql`
      SELECT * FROM media 
      WHERE user_id = ${user.id} AND is_active = true
      ORDER BY created_at DESC
    `

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error("Media fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}
