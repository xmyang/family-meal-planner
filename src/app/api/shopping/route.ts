import { NextResponse } from 'next/server'
import { getShoppingItems, addShoppingItem, toggleShoppingItem, deleteShoppingItem, replaceShoppingItems, addToMasterList, initDB } from '@/lib/db'
import type { ApiResponse, ApiError } from '@/lib/types'

export async function GET() {
  try {
    await initDB()
    const items = await getShoppingItems()
    return NextResponse.json({ data: items } satisfies ApiResponse<typeof items>)
  } catch (error) {
    console.error('GET /api/shopping error:', error)
    return NextResponse.json(
      { error: '获取购物清单失败', code: 'SHOPPING_FETCH_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await initDB()
    const body = await request.json()

    // Toggle checked status
    if (body.action === 'toggle' && typeof body.id === 'number') {
      await toggleShoppingItem(body.id, body.checked)
      // If checked, add to master list
      if (body.checked && body.name) {
        await addToMasterList(body.name, '其他')
      }
      return NextResponse.json({ data: { success: true } })
    }

    // Delete item
    if (body.action === 'delete' && typeof body.id === 'number') {
      await deleteShoppingItem(body.id)
      return NextResponse.json({ data: { success: true } })
    }

    // Add single item
    if (body.action === 'add' && body.name) {
      const item = await addShoppingItem({
        name: body.name,
        qty: body.qty || 1,
        unit: body.unit || '个',
        checked: false,
      })
      return NextResponse.json({ data: item } satisfies ApiResponse<typeof item>)
    }

    // Replace all items (from AI generate)
    if (body.action === 'replace' && Array.isArray(body.items)) {
      await replaceShoppingItems(body.items)
      return NextResponse.json({ data: { success: true } })
    }

    return NextResponse.json(
      { error: '无效的操作', code: 'INVALID_ACTION' } satisfies ApiError,
      { status: 400 }
    )
  } catch (error) {
    console.error('POST /api/shopping error:', error)
    return NextResponse.json(
      { error: '更新购物清单失败', code: 'SHOPPING_UPDATE_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
