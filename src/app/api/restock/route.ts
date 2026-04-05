import { NextResponse } from 'next/server'
import { getPantryItems } from '@/lib/db'
import { getRestockSuggestions } from '@/lib/claude'
import type { ApiResponse, ApiError } from '@/lib/types'

export async function POST() {
  try {
    const items = await getPantryItems()
    const pantryStr = items
      .map(i => `${i.name}×${i.qty}${i.unit}(${i.location})`)
      .join('、')

    const result = await getRestockSuggestions(pantryStr)
    return NextResponse.json({ data: result } satisfies ApiResponse<typeof result>)
  } catch (error) {
    console.error('POST /api/restock error:', error)
    return NextResponse.json(
      { error: '生成补货建议失败，请重试', code: 'RESTOCK_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
