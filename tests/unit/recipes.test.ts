import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RECIPES } from '@/data/recipes'

// Mock Anthropic SDK
const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.messages = { create: mockCreate }
    })
  }
})

// Mock DB
const mockGetRecipes = vi.fn()
const mockAddRecipe = vi.fn()
const mockUpdateRecipeIngredients = vi.fn()
const mockSeedRecipes = vi.fn()
vi.mock('@/lib/db', () => ({
  initDB: vi.fn(),
  getRecipes: mockGetRecipes,
  addRecipe: mockAddRecipe,
  updateRecipeIngredients: mockUpdateRecipeIngredients,
  seedRecipes: mockSeedRecipes,
}))

beforeEach(async () => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.doMock('@anthropic-ai/sdk', () => ({
    default: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.messages = { create: mockCreate }
    })
  }))
  vi.doMock('@/lib/db', () => ({
    initDB: vi.fn(),
    getRecipes: mockGetRecipes,
    addRecipe: mockAddRecipe,
    updateRecipeIngredients: mockUpdateRecipeIngredients,
    seedRecipes: mockSeedRecipes,
  }))
})

// ── 静态数据完整性 ─────────────────────────────────

describe('Recipes 数据完整性', () => {

  it('至少有 5 个菜谱', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(5)
  })

  it('每个菜谱必须有完整字段', () => {
    RECIPES.forEach(r => {
      expect(r.id).toBeGreaterThan(0)
      expect(r.name).toBeTruthy()
      expect(r.tags.length).toBeGreaterThan(0)
      expect(r.time).toBeTruthy()
      expect(r.ingredients.length).toBeGreaterThan(0)
      expect(r.steps.length).toBeGreaterThan(0)
      expect(r.nutrition).toBeTruthy()
      expect(r.icon).toBeTruthy()
    })
  })

  it('菜谱 id 不重复', () => {
    const ids = RECIPES.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('包含 Mia 和 Marcus 喜欢的菜', () => {
    const miaRecipes = RECIPES.filter(r => r.tags.some(t => t.includes('Mia')))
    const marcusRecipes = RECIPES.filter(r => r.tags.some(t => t.includes('Marcus')))
    expect(miaRecipes.length).toBeGreaterThan(0)
    expect(marcusRecipes.length).toBeGreaterThan(0)
  })

  it('包含中式、日式、意式/西式菜系', () => {
    const allTags = RECIPES.flatMap(r => r.tags)
    expect(allTags.some(t => t.includes('中式'))).toBe(true)
    expect(allTags.some(t => t.includes('日式'))).toBe(true)
    expect(allTags.some(t => t.includes('意式') || t.includes('西式'))).toBe(true)
  })

  it('标签筛选：选 Marcus最爱 能过滤出相关菜谱', () => {
    const filtered = RECIPES.filter(r => r.tags.includes('Marcus最爱'))
    expect(filtered.length).toBeGreaterThan(0)
    filtered.forEach(r => {
      expect(r.tags).toContain('Marcus最爱')
    })
  })

  it('标签筛选：选 快手 只返回快手菜', () => {
    const filtered = RECIPES.filter(r => r.tags.includes('快手'))
    expect(filtered.length).toBeGreaterThan(0)
    filtered.forEach(r => {
      expect(r.tags).toContain('快手')
    })
  })
})

// ── Recipes API Route ─────────────────────────────

describe('Recipes GET API Route', () => {

  it('GET 有数据时返回 { data: [...] }', async () => {
    const mockRecipes = [
      { id: 1, name: '韭菜饺子', tags: ['中式'], time: '25分钟', ingredients: ['韭菜'], steps: ['包饺子'], nutrition: '高蛋白', icon: '🥟' },
    ]
    mockGetRecipes.mockResolvedValue(mockRecipes)

    const { GET } = await import('@/app/api/recipes/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].name).toBe('韭菜饺子')
  })

  it('GET 空数据时自动 seed 初始菜谱', async () => {
    mockGetRecipes.mockResolvedValueOnce([])
    mockGetRecipes.mockResolvedValueOnce(RECIPES.map((r, i) => ({ ...r, id: i + 1 })))
    mockSeedRecipes.mockResolvedValue(undefined)

    const { GET } = await import('@/app/api/recipes/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockSeedRecipes).toHaveBeenCalledTimes(1)
    expect(json.data.length).toBeGreaterThan(0)
  })

  it('GET DB 异常时返回 500', async () => {
    mockGetRecipes.mockRejectedValue(new Error('DB down'))

    const { GET } = await import('@/app/api/recipes/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('RECIPES_FETCH_ERROR')
  })
})

describe('Recipes POST API Route', () => {

  it('POST 成功添加菜谱', async () => {
    const newRecipe = { id: 9, name: '番茄炒蛋', tags: ['中式'], time: '10分钟', ingredients: ['番茄', '鸡蛋'], steps: ['炒'], nutrition: '', icon: '🍳' }
    mockAddRecipe.mockResolvedValue(newRecipe)

    const { POST } = await import('@/app/api/recipes/route')
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '番茄炒蛋', ingredients: ['番茄', '鸡蛋'], tags: ['中式'] }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('番茄炒蛋')
  })

  it('POST 无 name 时返回 400', async () => {
    const { POST } = await import('@/app/api/recipes/route')
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ['番茄'] }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_BODY')
  })

  it('POST 无 ingredients 时返回 400', async () => {
    const { POST } = await import('@/app/api/recipes/route')
    const request = new Request('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '番茄炒蛋' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_BODY')
  })
})

// ── PATCH /api/recipes/[id] ───────────────────────

describe('Recipes PATCH API Route', () => {

  it('PATCH 成功更新配料', async () => {
    mockUpdateRecipeIngredients.mockResolvedValue(undefined)

    const { PATCH } = await import('@/app/api/recipes/[id]/route')
    const request = new Request('http://localhost/api/recipes/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ['新配料1', '新配料2'] }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(mockUpdateRecipeIngredients).toHaveBeenCalledWith(1, ['新配料1', '新配料2'])
  })

  it('PATCH 无效 id 时返回 400', async () => {
    const { PATCH } = await import('@/app/api/recipes/[id]/route')
    const request = new Request('http://localhost/api/recipes/abc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ['配料'] }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: 'abc' }) })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_ID')
  })

  it('PATCH 无 ingredients 时返回 400', async () => {
    const { PATCH } = await import('@/app/api/recipes/[id]/route')
    const request = new Request('http://localhost/api/recipes/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新名字' }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_BODY')
  })
})

// ── POST /api/recipes/extract ─────────────────────

describe('Recipes Extract API Route', () => {

  it('POST 无 text 时返回 400', async () => {
    const { POST } = await import('@/app/api/recipes/extract/route')
    const request = new Request('http://localhost/api/recipes/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('MISSING_TEXT')
  })

  it('POST 有 text 时调用 Claude 并返回提炼结果', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"name":"宫保鸡丁","ingredients":["鸡胸肉","花生","干辣椒"]}' }]
    })

    const { POST } = await import('@/app/api/recipes/extract/route')
    const request = new Request('http://localhost/api/recipes/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '宫保鸡丁的做法：用鸡胸肉切丁...' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('宫保鸡丁')
    expect(json.data.ingredients).toContain('鸡胸肉')
  })

  it('POST Claude 异常时返回 500', async () => {
    mockCreate.mockRejectedValue(new Error('Claude error'))

    const { POST } = await import('@/app/api/recipes/extract/route')
    const request = new Request('http://localhost/api/recipes/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '一些文字' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('EXTRACT_ERROR')
  })
})
