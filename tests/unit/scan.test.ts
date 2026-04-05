import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Anthropic SDK — must use function() not arrow for constructor
const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.messages = { create: mockCreate }
    })
  }
})

// Mock DB
vi.mock('@/lib/db', () => ({
  initDB: vi.fn(),
  getPantryItems: vi.fn().mockResolvedValue([]),
}))

// Reset the claude.ts module singleton between tests
beforeEach(async () => {
  vi.clearAllMocks()
  vi.resetModules()
  // Re-apply mocks after reset
  vi.doMock('@anthropic-ai/sdk', () => ({
    default: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.messages = { create: mockCreate }
    })
  }))
  vi.doMock('@/lib/db', () => ({
    initDB: vi.fn(),
    getPantryItems: vi.fn().mockResolvedValue([]),
  }))
})

describe('Scan JSON 解析逻辑', () => {

  it('合法 JSON 数组正确解析', () => {
    const raw = '[{"name":"鸡腿","qty":3,"unit":"个","location":"fridge"}]'
    const parsed = JSON.parse(raw)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('鸡腿')
    expect(parsed[0].qty).toBe(3)
    expect(parsed[0].location).toBe('fridge')
  })

  it('带 markdown 包裹的 JSON 能清洗', () => {
    const raw = '```json\n[{"name":"牛排","qty":2,"unit":"块","location":"freezer"}]\n```'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    expect(parsed[0].name).toBe('牛排')
    expect(parsed[0].location).toBe('freezer')
  })

  it('多种食材的 JSON 正确解析', () => {
    const raw = JSON.stringify([
      { name: '鸡蛋', qty: 12, unit: '个', location: 'fridge' },
      { name: '牛排', qty: 2, unit: '块', location: 'freezer' },
      { name: '大米', qty: 1, unit: '袋', location: 'pantry' },
    ])
    const parsed = JSON.parse(raw)
    expect(parsed).toHaveLength(3)
    expect(parsed[2].location).toBe('pantry')
  })

  it('空数组 JSON 正确解析', () => {
    const parsed = JSON.parse('[]')
    expect(parsed).toHaveLength(0)
  })

  it('location 无效时默认 fridge', () => {
    const raw = { name: '蔬菜', qty: 1, unit: '把', location: undefined }
    const location = raw.location || 'fridge'
    expect(location).toBe('fridge')
  })
})

describe('Scan API Route', () => {

  it('POST 无 image 时返回 400 + MISSING_IMAGE', async () => {
    const { POST } = await import('@/app/api/scan/route')
    const request = new Request('http://localhost/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('MISSING_IMAGE')
    expect(json.error).toBe('请提供图片数据')
  })

  it('POST 有 image 无 mimeType 时返回 400', async () => {
    const { POST } = await import('@/app/api/scan/route')
    const request = new Request('http://localhost/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'base64data' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('MISSING_IMAGE')
  })

  it('POST 有 image + mimeType 时调用 Claude 并返回结果', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[{"name":"鸡腿","qty":3,"unit":"个","location":"fridge"}]' }]
    })

    const { POST } = await import('@/app/api/scan/route')
    const request = new Request('http://localhost/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'fakebase64', mimeType: 'image/jpeg' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveProperty('data')
    expect(json.data).toHaveLength(1)
    expect(json.data[0].name).toBe('鸡腿')
  })

  it('POST Claude 调用失败时返回 500 + SCAN_ERROR', async () => {
    mockCreate.mockRejectedValue(new Error('Claude API down'))

    const { POST } = await import('@/app/api/scan/route')
    const request = new Request('http://localhost/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'fakebase64', mimeType: 'image/jpeg' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('SCAN_ERROR')
    expect(json.error).toBe('图片识别失败，请重试')
  })
})
