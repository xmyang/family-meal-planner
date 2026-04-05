import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DB module
vi.mock('@/lib/db', () => ({
  initDB: vi.fn().mockResolvedValue(undefined),
  getPantryItems: vi.fn(),
  updatePantryItemQty: vi.fn(),
  addPantryItem: vi.fn(),
  replacePantry: vi.fn(),
}))

import { getPantryItems, updatePantryItemQty, addPantryItem, replacePantry } from '@/lib/db'
import type { PantryItem } from '@/lib/types'
import { INITIAL_PANTRY } from '@/data/initial-pantry'

// ── 纯逻辑测试 ────────────────────────────────────────

describe('Pantry 业务逻辑', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getPantryItems 返回食材数组', async () => {
    const mockItems: PantryItem[] = [
      { id: 1, name: '牛排', category: '冷冻肉类', qty: 2, unit: '块', location: 'freezer', icon: '🥩' },
      { id: 2, name: '酸奶', category: '乳制品', qty: 4, unit: '杯', location: 'fridge', icon: '🥛' },
    ]
    vi.mocked(getPantryItems).mockResolvedValue(mockItems)

    const result = await getPantryItems()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('牛排')
    expect(result[1].location).toBe('fridge')
  })

  it('getPantryItems 空库存返回空数组', async () => {
    vi.mocked(getPantryItems).mockResolvedValue([])
    const result = await getPantryItems()
    expect(result).toHaveLength(0)
    expect(Array.isArray(result)).toBe(true)
  })

  it('updatePantryItemQty 被正确调用', async () => {
    vi.mocked(updatePantryItemQty).mockResolvedValue(undefined)
    await updatePantryItemQty(1, 5)
    expect(updatePantryItemQty).toHaveBeenCalledWith(1, 5)
  })

  it('addPantryItem 返回新增的食材', async () => {
    const newItem: PantryItem = {
      id: 11, name: '豆腐', category: '豆制品', qty: 2, unit: '块', location: 'fridge', icon: '🧈',
    }
    vi.mocked(addPantryItem).mockResolvedValue(newItem)
    const result = await addPantryItem({
      name: '豆腐', category: '豆制品', qty: 2, unit: '块', location: 'fridge', icon: '🧈',
    })
    expect(result.id).toBe(11)
    expect(result.name).toBe('豆腐')
  })

  it('replacePantry 被正确调用', async () => {
    const items = [{ name: '鸡蛋', category: '蛋类', qty: 6, unit: '个', location: 'fridge' as const, icon: '🥚' }]
    vi.mocked(replacePantry).mockResolvedValue(undefined)
    await replacePantry(items)
    expect(replacePantry).toHaveBeenCalledWith(items)
  })

  it('qty 不能低于 0（Math.max 保护）', () => {
    const qty = -3
    expect(Math.max(0, qty)).toBe(0)
  })

  it('qty 为 0 时继续减少仍为 0', () => {
    const qty = 0
    expect(Math.max(0, qty - 1)).toBe(0)
  })

  it('低库存判断：qty <= 1 为低库存', () => {
    const items: PantryItem[] = [
      { id: 1, name: '大米', category: '主食', qty: 1, unit: '袋', location: 'pantry', icon: '🌾' },
      { id: 2, name: '牛排', category: '冷冻肉类', qty: 2, unit: '块', location: 'freezer', icon: '🥩' },
      { id: 3, name: '面包', category: '主食', qty: 0, unit: '袋', location: 'freezer', icon: '🍞' },
    ]
    const lowStock = items.filter(i => i.qty <= 1)
    expect(lowStock).toHaveLength(2)
    expect(lowStock.map(i => i.name)).toContain('大米')
    expect(lowStock.map(i => i.name)).toContain('面包')
  })

  it('location 只接受 freezer/fridge/pantry', () => {
    const validLocations = ['freezer', 'fridge', 'pantry']
    INITIAL_PANTRY.forEach(item => {
      expect(validLocations).toContain(item.location)
    })
  })
})

// ── API Route handler 测试 ─────────────────────────────

describe('Pantry API Route', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET 成功时返回 { data: [...] } 格式', async () => {
    const mockItems: PantryItem[] = [
      { id: 1, name: '牛排', category: '冷冻肉类', qty: 2, unit: '块', location: 'freezer', icon: '🥩' },
    ]
    vi.mocked(getPantryItems).mockResolvedValue(mockItems)

    const { GET } = await import('@/app/api/pantry/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveProperty('data')
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data[0].name).toBe('牛排')
  })

  it('GET 失败时返回 500 + 统一错误格式', async () => {
    vi.mocked(getPantryItems).mockRejectedValue(new Error('DB down'))

    const { GET } = await import('@/app/api/pantry/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toHaveProperty('error')
    expect(json).toHaveProperty('code', 'PANTRY_FETCH_ERROR')
  })

  it('POST 成功时替换库存', async () => {
    vi.mocked(replacePantry).mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/pantry/route')
    const request = new Request('http://localhost/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pantry: [{ name: '牛排', category: '肉', qty: 1, unit: '块', location: 'freezer', icon: '🥩' }] }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(replacePantry).toHaveBeenCalledTimes(1)
  })

  it('POST body 无 pantry 数组时返回 400', async () => {
    const { POST } = await import('@/app/api/pantry/route')
    const request = new Request('http://localhost/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_BODY')
  })

  it('POST DB 异常时返回 500', async () => {
    vi.mocked(replacePantry).mockRejectedValue(new Error('DB error'))

    const { POST } = await import('@/app/api/pantry/route')
    const request = new Request('http://localhost/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pantry: [] }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('PANTRY_UPDATE_ERROR')
  })
})

// ── PATCH /api/pantry/[id] ──────────────────────────────

describe('Pantry PATCH API Route', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCH 成功时更新单个食材数量', async () => {
    vi.mocked(updatePantryItemQty).mockResolvedValue(undefined)

    const { PATCH } = await import('@/app/api/pantry/[id]/route')
    const request = new Request('http://localhost/api/pantry/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: 5 }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(json.data.id).toBe(1)
    expect(json.data.qty).toBe(5)
    expect(updatePantryItemQty).toHaveBeenCalledWith(1, 5)
  })

  it('PATCH 无效 id 时返回 400', async () => {
    const { PATCH } = await import('@/app/api/pantry/[id]/route')
    const request = new Request('http://localhost/api/pantry/abc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: 5 }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: 'abc' }) })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_ID')
  })

  it('PATCH 无 qty 时返回 400', async () => {
    const { PATCH } = await import('@/app/api/pantry/[id]/route')
    const request = new Request('http://localhost/api/pantry/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '牛排' }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_BODY')
  })

  it('PATCH DB 异常时返回 500', async () => {
    vi.mocked(updatePantryItemQty).mockRejectedValue(new Error('DB error'))

    const { PATCH } = await import('@/app/api/pantry/[id]/route')
    const request = new Request('http://localhost/api/pantry/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: 3 }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('PANTRY_PATCH_ERROR')
  })
})

// ── 初始数据完整性 ─────────────────────────────────────

describe('Initial Pantry 数据', () => {

  it('初始数据有 10 项', () => {
    expect(INITIAL_PANTRY).toHaveLength(10)
  })

  it('每项必须有 name/category/qty/unit/location/icon', () => {
    INITIAL_PANTRY.forEach(item => {
      expect(item.name).toBeTruthy()
      expect(item.category).toBeTruthy()
      expect(typeof item.qty).toBe('number')
      expect(item.qty).toBeGreaterThanOrEqual(0)
      expect(item.unit).toBeTruthy()
      expect(['freezer', 'fridge', 'pantry']).toContain(item.location)
      expect(item.icon).toBeTruthy()
    })
  })

  it('包含三种存储位置的食材', () => {
    const locations = new Set(INITIAL_PANTRY.map(i => i.location))
    expect(locations.has('freezer')).toBe(true)
    expect(locations.has('fridge')).toBe(true)
    expect(locations.has('pantry')).toBe(true)
  })
})
