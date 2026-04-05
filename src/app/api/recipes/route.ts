import { NextResponse } from 'next/server'
import { getRecipes, addRecipe, seedRecipes, initDB } from '@/lib/db'
import { RECIPES } from '@/data/recipes'
import type { ApiResponse, ApiError } from '@/lib/types'

export async function GET() {
  try {
    await initDB()
    const recipes = await getRecipes()
    if (recipes.length === 0) {
      // Seed with initial recipes
      await seedRecipes(RECIPES)
      const seeded = await getRecipes()
      return NextResponse.json({ data: seeded } satisfies ApiResponse<typeof seeded>)
    }
    return NextResponse.json({ data: recipes } satisfies ApiResponse<typeof recipes>)
  } catch (error) {
    console.error('GET /api/recipes error:', error)
    return NextResponse.json(
      { error: '获取菜谱失败', code: 'RECIPES_FETCH_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await initDB()
    const body = await request.json()
    if (!body.name || !Array.isArray(body.ingredients)) {
      return NextResponse.json(
        { error: '请提供菜名和配料', code: 'INVALID_BODY' } satisfies ApiError,
        { status: 400 }
      )
    }
    const recipe = await addRecipe({
      name: body.name,
      tags: body.tags || [],
      time: body.time || '',
      ingredients: body.ingredients,
      steps: body.steps || [],
      nutrition: body.nutrition || '',
      icon: body.icon || '🍽️',
    })
    return NextResponse.json({ data: recipe } satisfies ApiResponse<typeof recipe>)
  } catch (error) {
    console.error('POST /api/recipes error:', error)
    return NextResponse.json(
      { error: '添加菜谱失败', code: 'RECIPES_ADD_ERROR' } satisfies ApiError,
      { status: 500 }
    )
  }
}
