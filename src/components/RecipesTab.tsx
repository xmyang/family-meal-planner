'use client'

import { useState, useMemo } from 'react'
import type { Recipe } from '@/lib/types'

interface RecipesTabProps {
  recipes: Recipe[]
  onAddRecipe: (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => void
  onUpdateIngredients: (id: number, ingredients: string[]) => void
}

const ALL_TAGS_DEFAULT = ['中式', '日式', '意式', '西式', 'Mia最爱', 'Marcus最爱', '快手', '高蛋白', '冷冻']

export function RecipesTab({ recipes, onAddRecipe, onUpdateIngredients }: RecipesTabProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addMode, setAddMode] = useState<'manual' | 'extract'>('manual')
  // Manual form
  const [newName, setNewName] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newIcon, setNewIcon] = useState('🍽️')
  const [newTags, setNewTags] = useState<string[]>([])
  const [newIngredients, setNewIngredients] = useState('')
  const [newSteps, setNewSteps] = useState('')
  // Extract
  const [extractText, setExtractText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractResult, setExtractResult] = useState<{ name: string; ingredients: string[] } | null>(null)
  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editIngredients, setEditIngredients] = useState('')

  const allTags = useMemo(() => {
    const fromRecipes = recipes.flatMap(r => r.tags)
    return Array.from(new Set([...ALL_TAGS_DEFAULT, ...fromRecipes]))
  }, [recipes])

  const filtered = useMemo(() => {
    if (selectedTags.size === 0) return recipes
    return recipes.filter(r => r.tags.some(t => selectedTags.has(t)))
  }, [selectedTags, recipes])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const handleManualAdd = () => {
    if (!newName.trim()) return
    onAddRecipe({
      name: newName.trim(),
      tags: newTags,
      time: newTime || '30分钟',
      ingredients: newIngredients.split('\n').map(s => s.trim()).filter(Boolean),
      steps: newSteps.split('\n').map(s => s.trim()).filter(Boolean),
      nutrition: '',
      icon: newIcon,
    })
    resetForm()
  }

  const handleExtract = async () => {
    if (!extractText.trim()) return
    setExtracting(true)
    try {
      const res = await fetch('/api/recipes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractText }),
      })
      const json = await res.json()
      if (json.data) {
        setExtractResult(json.data)
      }
    } catch {
      // 静默
    } finally {
      setExtracting(false)
    }
  }

  const handleConfirmExtract = () => {
    if (!extractResult) return
    onAddRecipe({
      name: extractResult.name,
      tags: [],
      time: '30分钟',
      ingredients: extractResult.ingredients,
      steps: [],
      nutrition: '',
      icon: '🍽️',
    })
    setExtractResult(null)
    setExtractText('')
    setShowAddForm(false)
  }

  const resetForm = () => {
    setNewName('')
    setNewTime('')
    setNewIcon('🍽️')
    setNewTags([])
    setNewIngredients('')
    setNewSteps('')
    setShowAddForm(false)
    setAddMode('manual')
  }

  const startEditIngredients = (recipe: Recipe) => {
    setEditingId(recipe.id)
    setEditIngredients(recipe.ingredients.join('\n'))
  }

  const saveEditIngredients = () => {
    if (editingId === null) return
    const ingredients = editIngredients.split('\n').map(s => s.trim()).filter(Boolean)
    onUpdateIngredients(editingId, ingredients)
    setEditingId(null)
    setEditIngredients('')
  }

  return (
    <div>
      {/* Tag filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedTags.has(tag)
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tag}{selectedTags.has(tag) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {/* Recipe cards */}
      <div className="space-y-3">
        {filtered.map(recipe => (
          <div
            key={recipe.id}
            data-testid="recipe-card"
            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <span className="text-3xl flex-shrink-0">{recipe.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{recipe.name}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{recipe.time}</span>
            </button>

            {expanded === recipe.id && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase">食材</h4>
                    {editingId !== recipe.id && (
                      <button
                        onClick={() => startEditIngredients(recipe)}
                        className="text-xs text-amber-600 font-medium"
                      >
                        编辑
                      </button>
                    )}
                  </div>
                  {editingId === recipe.id ? (
                    <div>
                      <textarea
                        value={editIngredients}
                        onChange={e => setEditIngredients(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        placeholder="每行一种食材"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                        >
                          取消
                        </button>
                        <button
                          onClick={saveEditIngredients}
                          className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{recipe.ingredients.join('、')}</p>
                  )}
                </div>
                {recipe.steps.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">步骤</h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      {recipe.steps.map((step, i) => (
                        <li key={i}>{i + 1}. {step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {recipe.nutrition && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">营养</h4>
                    <p className="text-xs text-gray-500">{recipe.nutrition}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add recipe button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full py-3 mt-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-medium text-sm active:bg-gray-50"
      >
        + 添加新菜谱
      </button>

      {/* Add recipe form */}
      {showAddForm && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAddMode('manual')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                addMode === 'manual' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              手动录入
            </button>
            <button
              onClick={() => setAddMode('extract')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                addMode === 'extract' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              文本提炼
            </button>
          </div>

          {addMode === 'manual' ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="菜名"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="时间（如 20分钟）"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <input
                  type="text"
                  placeholder="图标"
                  value={newIcon}
                  onChange={e => setNewIcon(e.target.value)}
                  className="w-16 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              {/* Tags */}
              <div>
                <p className="text-xs text-gray-400 mb-1">标签</p>
                <div className="flex gap-1 flex-wrap">
                  {ALL_TAGS_DEFAULT.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setNewTags(prev =>
                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                      )}
                      className={`px-2 py-1 rounded text-[10px] font-medium ${
                        newTags.includes(tag) ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="配菜材料（每行一种）"
                value={newIngredients}
                onChange={e => setNewIngredients(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <textarea
                placeholder="步骤（每行一步）"
                value={newSteps}
                onChange={e => setNewSteps(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                onClick={handleManualAdd}
                className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm active:bg-amber-700"
              >
                添加菜谱
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                placeholder="粘贴菜谱文字（文章、截图文字等），AI 自动提炼配菜材料"
                value={extractText}
                onChange={e => setExtractText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                onClick={handleExtract}
                disabled={extracting || !extractText.trim()}
                className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm active:bg-amber-700 disabled:opacity-50"
              >
                {extracting ? 'AI 提炼中...' : '提炼配菜材料'}
              </button>

              {extractResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="font-semibold text-sm text-green-800 mb-1">{extractResult.name}</p>
                  <p className="text-xs text-green-700">
                    {extractResult.ingredients.join('、')}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setExtractResult(null)}
                      className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmExtract}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium"
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
