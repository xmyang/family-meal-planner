import Anthropic from '@anthropic-ai/sdk'
import type { ScanResult, RestockResponse, ExtractResult } from './types'

let _client: Anthropic | null = null

function getClient() {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _client
}

const FAMILY_SYSTEM_PROMPT = `你是这个家庭的饮食顾问。
家庭成员：Michelle（健身习惯，高蛋白需求），老公，
Mia 11岁（游泳运动员，爱韭菜饺子/葱油面），
Marcus 6岁（爱肉/披萨/日式，不吃鸡蛋）。
饮食风格：中日意混合，快手为主，冰柜储存充足。
只返回纯 JSON，不加任何说明文字或 markdown。`

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export async function scanImage(base64: string, mimeType: string): Promise<ScanResult[]> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType as ImageMediaType, data: base64 }
        },
        {
          type: 'text',
          text: `识别图片中所有食材。只返回 JSON 数组，不加任何说明：
[{"name":"食材名","qty":数量,"unit":"单位","location":"freezer或fridge或pantry"}]
location 规则：冰柜=freezer，冰箱=fridge，常温=pantry。不确定默认 fridge。`
        }
      ]
    }]
  })

  const block = response.content.find(b => b.type === 'text')
  const text = block && block.type === 'text' ? block.text : '[]'
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as ScanResult[]
}

export async function getRestockSuggestions(pantryStr: string): Promise<RestockResponse> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: FAMILY_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `当前库存：${pantryStr || '（空）'}

根据库存和家庭口味，给出补货建议。只返回 JSON：
{"analysis":"一句话总结","suggestions":[{"name":"食材","reason":"原因","priority":"high或medium或low","icon":"emoji"}]}
最多10条，按 priority 高到低排序。`
    }]
  })

  const block = response.content.find(b => b.type === 'text')
  const text = block && block.type === 'text' ? block.text : '{}'
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as RestockResponse
}

export async function extractRecipeFromText(text: string): Promise<ExtractResult> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `从以下文字中提炼出一道菜的名称和所需配菜材料（不含油盐酱油等基础调料）。只返回纯 JSON：
{"name":"菜名","ingredients":["材料1","材料2"]}

文字：${text}`
    }]
  })

  const block = response.content.find(b => b.type === 'text')
  const raw = block && block.type === 'text' ? block.text : '{}'
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as ExtractResult
}

export async function generateShoppingList(pantryStr: string): Promise<{ name: string; qty: number; unit: string }[]> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: FAMILY_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `当前库存：${pantryStr || '（空）'}

根据库存和家庭口味，生成本周购物清单。只返回 JSON 数组：
[{"name":"食材名","qty":数量,"unit":"单位"}]
最多15条，按重要性排序。`
    }]
  })

  const block = response.content.find(b => b.type === 'text')
  const raw = block && block.type === 'text' ? block.text : '[]'
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as { name: string; qty: number; unit: string }[]
}
