import { NextResponse } from 'next/server'
import { getPantryItems } from '@/lib/db'
import { generateShoppingList } from '@/lib/claude'
import type { ApiResponse, ApiError } from '@/lib/types'

export async function POST() {
  try {
    const items = await getPantryItems()
    const pantryStr = items
      .map(i => `${i.name}×${i.qty}${i.unit}(${i.location})`)
      .join('、')

    const result = await generateShoppingList(pantryStr)
    return NextResponse.json({ data: result } satisfies ApiResponse<typeof result>)
  } catch (error) {
    console.error('POST /api/shopping/generate error:', error)
    return NextResponse.json(
      { error: '生成购物清单失败，请重试', code: 'SHOPPING_GENERATE_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
