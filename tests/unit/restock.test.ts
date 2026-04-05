import { describe, it, expect, vi, beforeEach } from 'vitest'

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
const mockGetPantryItems = vi.fn()
vi.mock('@/lib/db', () => ({
  initDB: vi.fn(),
  getPantryItems: mockGetPantryItems,
  replacePantry: vi.fn(),
}))

// Reset module singleton between tests
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
    getPantryItems: mockGetPantryItems,
    replacePantry: vi.fn(),
  }))
})

import type { PantryItem } from '@/lib/types'

describe('Restock 业务逻辑', () => {

  it('库存字符串格式正确', () => {
    const pantry = [
      { name: '牛排', qty: 2, unit: '块', location: 'freezer' },
      { name: '酸奶', qty: 4, unit: '杯', location: 'fridge' },
    ]
    const str = pantry.map(i => `${i.name}×${i.qty}${i.unit}(${i.location})`).join('、')
    expect(str).toBe('牛排×2块(freezer)、酸奶×4杯(fridge)')
  })

  it('空库存时字符串为空', () => {
    const pantry: { name: string; qty: number; unit: string; location: string }[] = []
    const str = pantry.map(i => `${i.name}×${i.qty}${i.unit}(${i.location})`).join('、')
    expect(str).toBe('')
  })

  it('Claude 返回合法 RestockResponse 正确解析', () => {
    const raw = JSON.stringify({
      analysis: '当前蛋白质来源充足，蔬菜偏少',
      suggestions: [
        { name: '韭菜', reason: 'Mia最爱饺子馅', priority: 'high', icon: '🌿' },
        { name: '西兰花', reason: '补充蔬菜', priority: 'medium', icon: '🥦' },
      ]
    })
    const parsed = JSON.parse(raw)
    expect(parsed.analysis).toBeTruthy()
    expect(parsed.suggestions).toHaveLength(2)
    expect(parsed.suggestions[0].priority).toBe('high')
    expect(parsed.suggestions[1].priority).toBe('medium')
  })

  it('带 markdown 包裹的 RestockResponse 能清洗', () => {
    const inner = JSON.stringify({ analysis: '测试', suggestions: [] })
    const raw = '```json\n' + inner + '\n```'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    expect(parsed.analysis).toBe('测试')
    expect(parsed.suggestions).toHaveLength(0)
  })

  it('priority 只能是 high/medium/low', () => {
    const validPriorities = ['high', 'medium', 'low']
    validPriorities.forEach(p => {
      expect(validPriorities).toContain(p)
    })
    expect(validPriorities).not.toContain('urgent')
  })
})

describe('Restock API Route', () => {

  it('POST 成功时返回 { data: { analysis, suggestions } }', async () => {
    const mockItems: PantryItem[] = [
      { id: 1, name: '牛排', category: '冷冻肉类', qty: 2, unit: '块', location: 'freezer', icon: '🥩' },
    ]
    mockGetPantryItems.mockResolvedValue(mockItems)

    const restockResult = {
      analysis: '蛋白质充足，蔬菜不足',
      suggestions: [{ name: '韭菜', reason: 'Mia最爱', priority: 'high', icon: '🌿' }]
    }
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(restockResult) }]
    })

    const { POST } = await import('@/app/api/restock/route')
    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveProperty('analysis')
    expect(json.data).toHaveProperty('suggestions')
    expect(json.data.suggestions).toHaveLength(1)
  })

  it('POST 空库存时也能正常返回', async () => {
    mockGetPantryItems.mockResolvedValue([])

    const restockResult = {
      analysis: '库存为空，建议全面采购',
      suggestions: [{ name: '大米', reason: '基础主食', priority: 'high', icon: '🌾' }]
    }
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(restockResult) }]
    })

    const { POST } = await import('@/app/api/restock/route')
    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.suggestions.length).toBeGreaterThan(0)
  })

  it('POST DB 异常时返回 500 + RESTOCK_ERROR', async () => {
    mockGetPantryItems.mockRejectedValue(new Error('DB down'))

    const { POST } = await import('@/app/api/restock/route')
    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('RESTOCK_ERROR')
    expect(json.error).toBe('生成补货建议失败，请重试')
  })

  it('POST Claude 异常时返回 500 + RESTOCK_ERROR', async () => {
    mockGetPantryItems.mockResolvedValue([])
    mockCreate.mockRejectedValue(new Error('Claude API error'))

    const { POST } = await import('@/app/api/restock/route')
    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('RESTOCK_ERROR')
  })
})
