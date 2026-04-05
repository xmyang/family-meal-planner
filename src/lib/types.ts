export interface PantryItem {
  id: number
  name: string
  category: string
  qty: number
  unit: string
  location: 'freezer' | 'fridge' | 'pantry'
  icon: string
  created_at?: string
  updated_at?: string
}

export interface ScanResult {
  name: string
  qty: number
  unit: string
  location: 'freezer' | 'fridge' | 'pantry'
}

export interface RestockSuggestion {
  name: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  icon: string
}

export interface RestockResponse {
  analysis: string
  suggestions: RestockSuggestion[]
}

export interface Recipe {
  id: number
  name: string
  tags: string[]
  time: string
  ingredients: string[]
  steps: string[]
  nutrition: string
  icon: string
  created_at?: string
  updated_at?: string
}

export interface ExtractResult {
  name: string
  ingredients: string[]
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  code: string
}

export interface ShoppingItem {
  id: number
  name: string
  qty: number
  unit: string
  checked: boolean
  created_at?: string
}

export interface MasterShoppingItem {
  id: number
  name: string
  category: '水果' | '蔬菜' | '亚洲食品' | '冷冻食物' | '其他'
  store: 'Costco' | 'Woolworths' | '亚超' | ''
  created_at?: string
  updated_at?: string
}
