import { NextResponse } from "next/server"

export async function GET() {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    const vercelEnv = process.env.VERCEL_ENV || "development"
    const nodeEnv = process.env.NODE_ENV || "development"

    return NextResponse.json({
      success: true,
      config: {
        blobTokenExists: !!blobToken,
        blobTokenLength: blobToken ? blobToken.length : 0,
        environment: nodeEnv,
        vercelEnv: vercelEnv,
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
