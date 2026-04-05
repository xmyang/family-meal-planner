import { NextResponse } from 'next/server'
import { updateRecipeIngredients } from '@/lib/db'
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
        { error: '无效的菜谱 ID', code: 'INVALID_ID' } satisfies ApiError,
        { status: 400 }
      )
    }

    const body = await request.json()
    if (!Array.isArray(body.ingredients)) {
      return NextResponse.json(
        { error: '请提供 ingredients 数组', code: 'INVALID_BODY' } satisfies ApiError,
        { status: 400 }
      )
    }

    await updateRecipeIngredients(idNum, body.ingredients)
    return NextResponse.json({ data: { success: true, id: idNum } })
  } catch (error) {
    console.error('PATCH /api/recipes/[id] error:', error)
    return NextResponse.json(
      { error: '更新菜谱配料失败', code: 'RECIPES_PATCH_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
