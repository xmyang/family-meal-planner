'use client'

import { useState } from 'react'
import type { PantryItem } from '@/lib/types'
import { PantryItemCard } from '@/components/ui/PantryItem'
import { LowStockBanner } from '@/components/ui/LowStockBanner'

interface PantryTabProps {
  items: PantryItem[]
  onUpdateQty: (id: number, delta: number) => void
  onAddItem: (item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>) => void
}

const LOCATIONS = [
  { value: 'freezer' as const, label: '🧊 冰柜' },
  { value: 'fridge' as const, label: '🧊 冰箱' },
  { value: 'pantry' as const, label: '🏠 常温' },
]

export function PantryTab({ items, onUpdateQty, onAddItem }: PantryTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newUnit, setNewUnit] = useState('个')
  const [newLocation, setNewLocation] = useState<'freezer' | 'fridge' | 'pantry'>('fridge')
  const [filter, setFilter] = useState<string>('all')

  const grouped = {
    freezer: items.filter(i => i.location === 'freezer'),
    fridge: items.filter(i => i.location === 'fridge'),
    pantry: items.filter(i => i.location === 'pantry'),
  }

  const filteredGroups = filter === 'all'
    ? grouped
    : { [filter]: grouped[filter as keyof typeof grouped] }

  const handleAdd = () => {
    if (!newName.trim()) return
    onAddItem({
      name: newName.trim(),
      category: '手动添加',
      qty: Number(newQty) || 1,
      unit: newUnit,
      location: newLocation,
      icon: '🛒',
    })
    setNewName('')
    setNewQty('1')
    setShowAddForm(false)
  }

  return (
    <div>
      <LowStockBanner items={items} />

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { value: 'all', label: '全部' },
          { value: 'freezer', label: '🧊 冰柜' },
          { value: 'fridge', label: '❄️ 冰箱' },
          { value: 'pantry', label: '🏠 常温' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pantry items grouped by location */}
      {Object.entries(filteredGroups).map(([loc, locItems]) => {
        if (!locItems || locItems.length === 0) return null
        const labels: Record<string, string> = { freezer: '🧊 冰柜', fridge: '❄️ 冰箱', pantry: '🏠 常温' }
        return (
          <div key={loc} className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {labels[loc] || loc} ({locItems.length})
            </h3>
            <div className="space-y-2">
              {locItems.map(item => (
                <PantryItemCard key={item.id} item={item} onUpdateQty={onUpdateQty} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Add button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full py-3 mt-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-medium text-sm active:bg-gray-50"
      >
        + 手动添加
      </button>

      {/* Add form */}
      {showAddForm && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200 space-y-3">
          <input
            type="text"
            placeholder="食材名称"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              min="0"
            />
            <input
              type="text"
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
              placeholder="单位"
              className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <select
              value={newLocation}
              onChange={e => setNewLocation(e.target.value as 'freezer' | 'fridge' | 'pantry')}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {LOCATIONS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
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
