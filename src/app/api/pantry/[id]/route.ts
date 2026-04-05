import { NextResponse } from 'next/server'
import { updatePantryItemQty } from '@/lib/db'
import type { ApiError } from '@/lib/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = Number(id)
    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: '无效的食材 ID', code: 'INVALID_ID' } satisfies ApiError,
        { status: 400 }
      )
    }

    const body = await request.json()
    if (typeof body.qty !== 'number') {
      return NextResponse.json(
        { error: '请提供 qty 数量', code: 'INVALID_BODY' } satisfies ApiError,
        { status: 400 }
      )
    }

    await updatePantryItemQty(idNum, body.qty)
    return NextResponse.json({ data: { success: true, id: idNum, qty: Math.max(0, body.qty) } })
  } catch (error) {
    console.error('PATCH /api/pantry/[id] error:', error)
    return NextResponse.json(
      { error: '更新食材数量失败', code: 'PANTRY_PATCH_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
