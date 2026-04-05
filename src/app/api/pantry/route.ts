import { NextResponse } from 'next/server'
import { getPantryItems, replacePantry, initDB } from '@/lib/db'
import type { ApiResponse, ApiError } from '@/lib/types'

export async function GET() {
  try {
    await initDB()
    const items = await getPantryItems()
    return NextResponse.json({ data: items } satisfies ApiResponse<typeof items>)
  } catch (error) {
    console.error('GET /api/pantry error:', error)
    return NextResponse.json(
      { error: '获取食材库存失败', code: 'PANTRY_FETCH_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!Array.isArray(body.pantry)) {
      return NextResponse.json(
        { error: '请提供 pantry 数组', code: 'INVALID_BODY' } satisfies ApiError,
        { status: 400 }
      )
    }
    await replacePantry(body.pantry)
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('POST /api/pantry error:', error)
    return NextResponse.json(
      { error: '更新食材库存失败', code: 'PANTRY_UPDATE_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
