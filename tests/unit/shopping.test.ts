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
const mockGetShoppingItems = vi.fn()
const mockAddShoppingItem = vi.fn()
const mockToggleShoppingItem = vi.fn()
const mockDeleteShoppingItem = vi.fn()
const mockReplaceShoppingItems = vi.fn()
const mockAddToMasterList = vi.fn()
const mockGetPantryItems = vi.fn()
const mockGetMasterShoppingItems = vi.fn()
const mockUpsertMasterShoppingItem = vi.fn()
const mockUpdateMasterItemStore = vi.fn()

vi.mock('@/lib/db', () => ({
  initDB: vi.fn(),
  getShoppingItems: mockGetShoppingItems,
  addShoppingItem: mockAddShoppingItem,
  toggleShoppingItem: mockToggleShoppingItem,
  deleteShoppingItem: mockDeleteShoppingItem,
  replaceShoppingItems: mockReplaceShoppingItems,
  addToMasterList: mockAddToMasterList,
  getPantryItems: mockGetPantryItems,
  getMasterShoppingItems: mockGetMasterShoppingItems,
  upsertMasterShoppingItem: mockUpsertMasterShoppingItem,
  updateMasterItemStore: mockUpdateMasterItemStore,
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
    getShoppingItems: mockGetShoppingItems,
    addShoppingItem: mockAddShoppingItem,
    toggleShoppingItem: mockToggleShoppingItem,
    deleteShoppingItem: mockDeleteShoppingItem,
    replaceShoppingItems: mockReplaceShoppingItems,
    addToMasterList: mockAddToMasterList,
    getPantryItems: mockGetPantryItems,
    getMasterShoppingItems: mockGetMasterShoppingItems,
    upsertMasterShoppingItem: mockUpsertMasterShoppingItem,
    updateMasterItemStore: mockUpdateMasterItemStore,
  }))
})

// ── Shopping API Route ────────────────────────────

describe('Shopping GET API Route', () => {

  it('GET 返回购物清单', async () => {
    mockGetShoppingItems.mockResolvedValue([
      { id: 1, name: '牛奶', qty: 2, unit: '瓶', checked: false },
    ])

    const { GET } = await import('@/app/api/shopping/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].name).toBe('牛奶')
  })

  it('GET DB 异常时返回 500', async () => {
    mockGetShoppingItems.mockRejectedValue(new Error('DB down'))

    const { GET } = await import('@/app/api/shopping/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('SHOPPING_FETCH_ERROR')
  })
})

describe('Shopping POST API Route', () => {

  it('POST action=add 添加购物项', async () => {
    const newItem = { id: 2, name: '鸡蛋', qty: 12, unit: '个', checked: false }
    mockAddShoppingItem.mockResolvedValue(newItem)

    const { POST } = await import('@/app/api/shopping/route')
    const request = new Request('http://localhost/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', name: '鸡蛋', qty: 12, unit: '个' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('鸡蛋')
    expect(mockAddShoppingItem).toHaveBeenCalledTimes(1)
  })

  it('POST action=toggle 标记已购', async () => {
    mockToggleShoppingItem.mockResolvedValue(undefined)
    mockAddToMasterList.mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/shopping/route')
    const request = new Request('http://localhost/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id: 1, checked: true, name: '牛奶' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(mockToggleShoppingItem).toHaveBeenCalledWith(1, true)
    expect(mockAddToMasterList).toHaveBeenCalledWith('牛奶', '其他')
  })

  it('POST action=toggle unchecked 不添加到 master', async () => {
    mockToggleShoppingItem.mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/shopping/route')
    const request = new Request('http://localhost/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id: 1, checked: false, name: '牛奶' }),
    })
    await POST(request)

    expect(mockAddToMasterList).not.toHaveBeenCalled()
  })

  it('POST action=delete 删除购物项', async () => {
    mockDeleteShoppingItem.mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/shopping/route')
    const request = new Request('http://localhost/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: 1 }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(mockDeleteShoppingItem).toHaveBeenCalledWith(1)
  })

  it('POST action=replace 替换全部', async () => {
    mockReplaceShoppingItems.mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/shopping/route')
    const items = [{ name: '牛奶', qty: 2, unit: '瓶', checked: false }]
    const request = new Request('http://localhost/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'replace', items }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(mockReplaceShoppingItems).toHaveBeenCalledWith(items)
  })

  it('POST 无效 action 返回 400', async () => {
    const { POST } = await import('@/app/api/shopping/route')
    const request = new Request('http://localhost/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_ACTION')
  })
})

// ── Shopping Generate API Route ───────────────────

describe('Shopping Generate API Route', () => {

  it('POST 成功生成购物清单', async () => {
    mockGetPantryItems.mockResolvedValue([
      { id: 1, name: '牛排', qty: 2, unit: '块', location: 'freezer' },
    ])
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[{"name":"韭菜","qty":1,"unit":"把"},{"name":"牛奶","qty":2,"unit":"瓶"}]' }]
    })

    const { POST } = await import('@/app/api/shopping/generate/route')
    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].name).toBe('韭菜')
  })

  it('POST Claude 异常时返回 500', async () => {
    mockGetPantryItems.mockResolvedValue([])
    mockCreate.mockRejectedValue(new Error('Claude error'))

    const { POST } = await import('@/app/api/shopping/generate/route')
    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.code).toBe('SHOPPING_GENERATE_ERROR')
  })
})

// ── Master Shopping API Route ─────────────────────

describe('Master Shopping GET API Route', () => {

  it('GET 返回 master 清单', async () => {
    mockGetMasterShoppingItems.mockResolvedValue([
      { id: 1, name: '牛奶', category: '其他', store: 'Woolworths' },
    ])

    const { GET } = await import('@/app/api/master-shopping/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].store).toBe('Woolworths')
  })
})

describe('Master Shopping POST API Route', () => {

  it('POST action=update-store 更新渠道', async () => {
    mockUpdateMasterItemStore.mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/master-shopping/route')
    const request = new Request('http://localhost/api/master-shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-store', id: 1, store: 'Costco' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.success).toBe(true)
    expect(mockUpdateMasterItemStore).toHaveBeenCalledWith(1, 'Costco')
  })

  it('POST action=add 添加到 master', async () => {
    const newItem = { id: 2, name: '韭菜', category: '蔬菜', store: '' }
    mockUpsertMasterShoppingItem.mockResolvedValue(newItem)

    const { POST } = await import('@/app/api/master-shopping/route')
    const request = new Request('http://localhost/api/master-shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', name: '韭菜', category: '蔬菜' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.name).toBe('韭菜')
    expect(json.data.category).toBe('蔬菜')
  })

  it('POST 无效 action 返回 400', async () => {
    const { POST } = await import('@/app/api/master-shopping/route')
    const request = new Request('http://localhost/api/master-shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid' }),
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.code).toBe('INVALID_ACTION')
  })
})
