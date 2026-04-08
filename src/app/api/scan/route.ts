import { NextResponse } from 'next/server'
import { scanImage } from '@/lib/claude'
import type { ApiResponse, ApiError } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.image || !body.mimeType) {
      return NextResponse.json(
        { error: '请提供图片数据', code: 'MISSING_IMAGE' } satisfies ApiError,
        { status: 400 }
      )
    }

    const items = await scanImage(body.image, body.mimeType)
    return NextResponse.json({ data: items } satisfies ApiResponse<typeof items>)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('POST /api/scan error:', message)
    return NextResponse.json(
      { error: `图片识别失败: ${message}`, code: 'SCAN_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
