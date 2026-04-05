'use client'

import type { PantryItem } from '@/lib/types'

interface LowStockBannerProps {
  items: PantryItem[]
}

export function LowStockBanner({ items }: LowStockBannerProps) {
  const lowStock = items.filter(i => i.qty <= 1)

  if (lowStock.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
      <p className="text-sm font-semibold text-red-700 mb-1">
        ⚠️ 低库存提醒 ({lowStock.length}项)
      </p>
      <p className="text-xs text-red-600">
        {lowStock.map(i => `${i.icon} ${i.name}`).join('、')}
      </p>
    </div>
  )
}
