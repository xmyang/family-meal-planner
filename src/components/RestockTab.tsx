'use client'

import { useState } from 'react'
import type { RestockResponse } from '@/lib/types'

const PRIORITY_STYLES = {
  high: 'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-green-50 border-green-200 text-green-700',
}

const PRIORITY_LABELS = {
  high: '🔴 急需',
  medium: '🟡 建议',
  low: '🟢 可选',
}

export function RestockTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RestockResponse | null>(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/restock', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || '分析失败')
        return
      }

      setResult(json.data)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        AI 会根据你的库存和家庭口味，智能推荐需要补货的食材。
      </p>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium text-sm active:bg-amber-700 disabled:opacity-50"
      >
        {loading ? '🔍 分析库存中...' : '🛒 分析库存，生成补货建议'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          {/* Analysis summary */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4">
            <p className="text-sm text-blue-700">{result.analysis}</p>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            {result.suggestions.map((s, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl border ${PRIORITY_STYLES[s.priority]}`}
              >
                <span className="text-2xl flex-shrink-0">{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <span className="text-xs opacity-70">{PRIORITY_LABELS[s.priority]}</span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-80">{s.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
