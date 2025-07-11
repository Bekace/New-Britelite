import { NextResponse } from "next/server"

export async function GET() {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN

    return NextResponse.json({
      success: true,
      config: {
        blobTokenExists: !!blobToken,
        blobTokenLength: blobToken ? blobToken.length : 0,
        environment: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Blob config debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
