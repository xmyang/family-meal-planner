'use client'

import { useState } from 'react'
import type { ShoppingItem } from '@/lib/types'

interface ShoppingTabProps {
  items: ShoppingItem[]
  onToggle: (id: number, checked: boolean, name: string) => void
  onDelete: (id: number) => void
  onAdd: (name: string, qty: number, unit: string) => void
  onGenerate: () => void
  generating: boolean
}

export function ShoppingTab({ items, onToggle, onDelete, onAdd, onGenerate, generating }: ShoppingTabProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newUnit, setNewUnit] = useState('个')

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName.trim(), Number(newQty) || 1, newUnit)
    setNewName('')
    setNewQty('1')
    setShowAdd(false)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        手动添加或让 AI 根据库存自动生成购物清单。
      </p>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full py-3 mb-4 bg-amber-600 text-white rounded-xl font-medium text-sm active:bg-amber-700 disabled:opacity-50"
      >
        {generating ? 'AI 生成中...' : 'AI 智能生成购物清单'}
      </button>

      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <div className="space-y-2 mb-4">
          {unchecked.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <button
                onClick={() => onToggle(item.id, true, item.name)}
                className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 active:bg-green-100"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-gray-400 ml-2">{item.qty}{item.unit}</span>
              </div>
              <button
                onClick={() => onDelete(item.id)}
                className="text-gray-300 text-lg active:text-red-400 w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {unchecked.length === 0 && items.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          购物清单为空，点击上方按钮生成或手动添加
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            已购 ({checked.length})
          </h3>
          <div className="space-y-2">
            {checked.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
                <button
                  onClick={() => onToggle(item.id, false, item.name)}
                  className="w-6 h-6 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white text-xs"
                >
                  ✓
                </button>
                <span className="text-sm line-through text-gray-400 flex-1">{item.name}</span>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-gray-300 text-lg active:text-red-400 w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full py-3 mt-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-medium text-sm active:bg-gray-50"
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
