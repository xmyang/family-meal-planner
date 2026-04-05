'use client'

import { useState } from 'react'
import type { MasterShoppingItem } from '@/lib/types'

interface MasterShoppingTabProps {
  items: MasterShoppingItem[]
  onUpdateStore: (id: number, store: MasterShoppingItem['store']) => void
  onAddItem: (name: string, category: MasterShoppingItem['category']) => void
}

const CATEGORIES: MasterShoppingItem['category'][] = ['水果', '蔬菜', '亚洲食品', '冷冻食物', '其他']
const STORES: { value: MasterShoppingItem['store']; label: string }[] = [
  { value: '', label: '未标注' },
  { value: 'Costco', label: 'Costco' },
  { value: 'Woolworths', label: 'Woolworths' },
  { value: '亚超', label: '亚超' },
]

const CATEGORY_ICONS: Record<string, string> = {
  '水果': '🍎',
  '蔬菜': '🥬',
  '亚洲食品': '🥢',
  '冷冻食物': '🧊',
  '其他': '📦',
}

const STORE_COLORS: Record<string, string> = {
  'Costco': 'bg-red-100 text-red-700',
  'Woolworths': 'bg-green-100 text-green-700',
  '亚超': 'bg-yellow-100 text-yellow-700',
  '': 'bg-gray-100 text-gray-500',
}

export function MasterShoppingTab({ items, onUpdateStore, onAddItem }: MasterShoppingTabProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<MasterShoppingItem['category']>('其他')

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat)
    return acc
  }, {} as Record<string, MasterShoppingItem[]>)

  const handleAdd = () => {
    if (!newName.trim()) return
    onAddItem(newName.trim(), newCategory)
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        所有买过的食材汇总，可标注常购渠道。
      </p>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Master 清单为空，购物完成打勾后自动添加
        </div>
      )}

      {CATEGORIES.map(cat => {
        const catItems = grouped[cat]
        if (!catItems || catItems.length === 0) return null
        return (
          <div key={cat} className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {CATEGORY_ICONS[cat]} {cat} ({catItems.length})
            </h3>
            <div className="space-y-2">
              {catItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                  <span className="text-sm font-medium">{item.name}</span>
                  <select
                    value={item.store}
                    onChange={e => onUpdateStore(item.id, e.target.value as MasterShoppingItem['store'])}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${STORE_COLORS[item.store] || STORE_COLORS['']}`}
                  >
                    {STORES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full py-3 mt-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-medium text-sm active:bg-gray-50"
      >
        + 手动添加
      </button>

      {showAdd && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200 space-y-3">
          <input
            type="text"
            placeholder="食材名称"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value as MasterShoppingItem['category'])}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm active:bg-amber-700"
          >
            添加
          </button>
        </div>
      )}
    </div>
  )
}
