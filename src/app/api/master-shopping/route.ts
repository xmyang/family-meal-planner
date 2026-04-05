import { NextResponse } from 'next/server'
import { getMasterShoppingItems, upsertMasterShoppingItem, updateMasterItemStore, initDB } from '@/lib/db'
import type { ApiResponse, ApiError, MasterShoppingItem } from '@/lib/types'

export async function GET() {
  try {
    await initDB()
    const items = await getMasterShoppingItems()
    return NextResponse.json({ data: items } satisfies ApiResponse<typeof items>)
  } catch (error) {
    console.error('GET /api/master-shopping error:', error)
    return NextResponse.json(
      { error: '获取 Master 清单失败', code: 'MASTER_FETCH_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await initDB()
    const body = await request.json()

    // Update store for an item
    if (body.action === 'update-store' && typeof body.id === 'number') {
      await updateMasterItemStore(body.id, body.store || '')
      return NextResponse.json({ data: { success: true } })
    }

    // Add/upsert item
    if (body.action === 'add' && body.name) {
      const item = await upsertMasterShoppingItem(
        body.name,
        (body.category || '其他') as MasterShoppingItem['category'],
        (body.store || '') as MasterShoppingItem['store']
      )
      return NextResponse.json({ data: item } satisfies ApiResponse<typeof item>)
    }

    return NextResponse.json(
      { error: '无效的操作', code: 'INVALID_ACTION' } satisfies ApiError,
      { status: 400 }
    )
  } catch (error) {
    console.error('POST /api/master-shopping error:', error)
    return NextResponse.json(
      { error: '更新 Master 清单失败', code: 'MASTER_UPDATE_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
