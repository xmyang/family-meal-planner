import { NextResponse } from 'next/server'
import { extractRecipeFromText } from '@/lib/claude'
import type { ApiResponse, ApiError } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: '请提供文本内容', code: 'MISSING_TEXT' } satisfies ApiError,
        { status: 400 }
      )
    }

    const result = await extractRecipeFromText(body.text)
    return NextResponse.json({ data: result } satisfies ApiResponse<typeof result>)
  } catch (error) {
    console.error('POST /api/recipes/extract error:', error)
    return NextResponse.json(
      { error: '提炼菜谱失败，请重试', code: 'EXTRACT_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
