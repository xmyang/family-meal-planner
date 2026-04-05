import type { PantryItem } from '@/lib/types'

export const INITIAL_PANTRY: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: '牛排',       category: '冷冻肉类', qty: 2, unit: '块', location: 'freezer', icon: '🥩' },
  { name: '羊排',       category: '冷冻肉类', qty: 2, unit: '块', location: 'freezer', icon: '🍖' },
  { name: '冻鱼',       category: '冷冻海鲜', qty: 3, unit: '条', location: 'freezer', icon: '🐟' },
  { name: '面包',       category: '主食',     qty: 1, unit: '袋', location: 'freezer', icon: '🍞' },
  { name: '酸奶',       category: '乳制品',   qty: 4, unit: '杯', location: 'fridge',  icon: '🥛' },
  { name: '鸡蛋',       category: '蛋类',     qty: 6, unit: '个', location: 'fridge',  icon: '🥚' },
  { name: '意面',       category: '主食',     qty: 2, unit: '包', location: 'pantry',  icon: '🍝' },
  { name: '意面酱',     category: '调料',     qty: 2, unit: '罐', location: 'pantry',  icon: '🍅' },
  { name: '大米',       category: '主食',     qty: 1, unit: '袋', location: 'pantry',  icon: '🌾' },
  { name: '韭菜饺子皮', category: '冷冻主食', qty: 1, unit: '包', location: 'freezer', icon: '🥟' },
]
