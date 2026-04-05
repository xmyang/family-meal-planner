'use client'

import type { PantryItem as PantryItemType } from '@/lib/types'

interface PantryItemProps {
  item: PantryItemType
  onUpdateQty: (id: number, delta: number) => void
}

const LOCATION_LABELS: Record<string, string> = {
  freezer: '冰柜',
  fridge: '冰箱',
  pantry: '常温',
}

export function PantryItemCard({ item, onUpdateQty }: PantryItemProps) {
  const isLowStock = item.qty <= 1

  return (
    <div
      data-testid="pantry-item"
      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
        isLowStock
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl flex-shrink-0">{item.icon}</span>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{item.name}</p>
          <p className="text-xs text-gray-400">
            {LOCATION_LABELS[item.location] || item.location}
            {isLowStock && <span className="ml-1 text-red-500 font-medium">· 库存低</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onUpdateQty(item.id, -1)}
          className="w-11 h-11 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center active:bg-gray-200"
        >
          -
        </button>
        <span className="w-12 text-center font-medium text-sm">
          {item.qty}{item.unit}
        </span>
        <button
          onClick={() => onUpdateQty(item.id, 1)}
          className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 font-bold text-lg flex items-center justify-center active:bg-amber-200"
        >
          +
        </button>
      </div>
    </div>
  )
}
