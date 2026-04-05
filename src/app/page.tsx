'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PantryItem, Recipe, ShoppingItem, MasterShoppingItem } from '@/lib/types'
import { INITIAL_PANTRY } from '@/data/initial-pantry'
import { RECIPES as STATIC_RECIPES } from '@/data/recipes'
import { TabBar, type Tab } from '@/components/ui/TabBar'
import { PantryTab } from '@/components/PantryTab'
import { ScanTab } from '@/components/ScanTab'
import { RestockTab } from '@/components/RestockTab'
import { RecipesTab } from '@/components/RecipesTab'
import { ShoppingTab } from '@/components/ShoppingTab'
import { MasterShoppingTab } from '@/components/MasterShoppingTab'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('pantry')
  const [pantry, setPantry] = useState<PantryItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [shopping, setShopping] = useState<ShoppingItem[]>([])
  const [masterShopping, setMasterShopping] = useState<MasterShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingShopping, setGeneratingShopping] = useState(false)

  // ── Fetch pantry ──────────────────────────────────
  const fetchPantry = useCallback(async () => {
    try {
      const res = await fetch('/api/pantry')
      const json = await res.json()
      if (json.data && json.data.length > 0) {
        setPantry(json.data)
      } else {
        // DB 为空，seed 初始数据到 DB 并重新读取
        await fetch('/api/pantry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pantry: INITIAL_PANTRY }),
        })
        const res2 = await fetch('/api/pantry')
        const json2 = await res2.json()
        if (json2.data && json2.data.length > 0) {
          setPantry(json2.data)
        } else {
          // 仍然失败则用本地数据
          setPantry(INITIAL_PANTRY.map((item, i) => ({ ...item, id: i + 1 })))
        }
      }
    } catch {
      setPantry(INITIAL_PANTRY.map((item, i) => ({ ...item, id: i + 1 })))
    }
  }, [])

  // ── Fetch recipes ─────────────────────────────────
  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes')
      const json = await res.json()
      if (json.data && json.data.length > 0) {
        setRecipes(json.data)
      } else {
        setRecipes(STATIC_RECIPES.map((r, i) => ({ ...r, id: i + 1 })))
      }
    } catch {
      setRecipes(STATIC_RECIPES.map((r, i) => ({ ...r, id: i + 1 })))
    }
  }, [])

  // ── Fetch shopping ────────────────────────────────
  const fetchShopping = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping')
      const json = await res.json()
      if (json.data) setShopping(json.data)
    } catch {
      // 静默
    }
  }, [])

  // ── Fetch master shopping ─────────────────────────
  const fetchMasterShopping = useCallback(async () => {
    try {
      const res = await fetch('/api/master-shopping')
      const json = await res.json()
      if (json.data) setMasterShopping(json.data)
    } catch {
      // 静默
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchPantry(), fetchRecipes(), fetchShopping(), fetchMasterShopping()])
      .finally(() => setLoading(false))
  }, [fetchPantry, fetchRecipes, fetchShopping, fetchMasterShopping])

  // ── Pantry actions ────────────────────────────────
  const updateQty = (id: number, delta: number) => {
    setPantry(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      const newQty = Math.max(0, item.qty + delta)
      patchItemQty(id, newQty)
      return prev.map(i => i.id === id ? { ...i, qty: newQty } : i)
    })
  }

  const patchItemQty = async (id: number, qty: number) => {
    try {
      await fetch(`/api/pantry/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      })
    } catch { /* 静默 */ }
  }

  const syncPantryToAPI = async (items: PantryItem[]) => {
    try {
      await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pantry: items }),
      })
    } catch { /* 静默 */ }
  }

  const addItem = (item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = Math.max(0, ...pantry.map(p => p.id)) + 1
    setPantry(prev => {
      const updated = [...prev, { ...item, id: newId }]
      syncPantryToAPI(updated)
      return updated
    })
  }

  const addScannedItems = (items: { name: string; qty: number; unit: string; location: 'freezer' | 'fridge' | 'pantry' }[]) => {
    setPantry(prev => {
      const updated = [...prev]
      let maxId = Math.max(0, ...prev.map(p => p.id))

      for (const scanned of items) {
        const existing = updated.find(
          p => p.name === scanned.name && p.location === scanned.location
        )
        if (existing) {
          existing.qty += scanned.qty
        } else {
          maxId++
          updated.push({
            id: maxId,
            name: scanned.name,
            category: '扫描添加',
            qty: scanned.qty,
            unit: scanned.unit,
            location: scanned.location,
            icon: '🛒',
          })
        }
      }

      syncPantryToAPI(updated)
      return updated
    })
    setActiveTab('pantry')
  }

  // ── Recipe actions ────────────────────────────────
  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => {
    // Optimistic local update
    const tempId = Math.max(0, ...recipes.map(r => r.id)) + 1
    setRecipes(prev => [...prev, { ...recipe, id: tempId }])

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      })
      const json = await res.json()
      if (json.data) {
        setRecipes(prev => prev.map(r => r.id === tempId ? json.data : r))
      }
    } catch { /* 静默 */ }
  }

  const updateRecipeIngredients = async (id: number, ingredients: string[]) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ingredients } : r))
    try {
      await fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })
    } catch { /* 静默 */ }
  }

  // ── Shopping actions ──────────────────────────────
  const toggleShoppingItem = async (id: number, checked: boolean, name: string) => {
    setShopping(prev => prev.map(i => i.id === id ? { ...i, checked } : i))
    try {
      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id, checked, name }),
      })
      if (checked) fetchMasterShopping()
    } catch { /* 静默 */ }
  }

  const deleteShoppingItem = async (id: number) => {
    setShopping(prev => prev.filter(i => i.id !== id))
    try {
      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
    } catch { /* 静默 */ }
  }

  const addShoppingItem = async (name: string, qty: number, unit: string) => {
    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', name, qty, unit }),
      })
      const json = await res.json()
      if (json.data && json.data.id) {
        setShopping(prev => [...prev, json.data])
      }
    } catch { /* 静默 */ }
  }

  const generateShoppingList = async () => {
    setGeneratingShopping(true)
    try {
      const res = await fetch('/api/shopping/generate', { method: 'POST' })
      const json = await res.json()
      if (json.data && Array.isArray(json.data)) {
        const items = json.data.map((i: { name: string; qty: number; unit: string }) => ({
          ...i,
          checked: false,
        }))
        await fetch('/api/shopping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'replace', items }),
        })
        await fetchShopping()
      }
    } catch { /* 静默 */ }
    finally {
      setGeneratingShopping(false)
    }
  }

  // ── Master shopping actions ───────────────────────
  const updateMasterStore = async (id: number, store: MasterShoppingItem['store']) => {
    setMasterShopping(prev => prev.map(i => i.id === id ? { ...i, store } : i))
    try {
      await fetch('/api/master-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-store', id, store }),
      })
    } catch { /* 静默 */ }
  }

  const addMasterItem = async (name: string, category: MasterShoppingItem['category']) => {
    try {
      const res = await fetch('/api/master-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', name, category }),
      })
      const json = await res.json()
      if (json.data && json.data.id) {
        setMasterShopping(prev => {
          const exists = prev.find(i => i.id === json.data.id)
          if (exists) return prev.map(i => i.id === json.data.id ? json.data : i)
          return [...prev, json.data]
        })
      }
    } catch { /* 静默 */ }
  }

  return (
    <div className="flex flex-col h-full max-w-[480px] mx-auto w-full">
      {/* Header */}
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold text-center text-amber-900">
          Milo
        </h1>
        <p className="text-xs text-center text-amber-600 mt-0.5">MMMY家庭 饮食管理小助手</p>
        <div className="flex justify-center gap-3 mt-2">
          <span className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">Michelle</span>
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">Mia</span>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Marcus</span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Yong</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pantry' && (
              <PantryTab
                items={pantry}
                onUpdateQty={updateQty}
                onAddItem={addItem}
              />
            )}
            {activeTab === 'scan' && (
              <ScanTab onItemsScanned={addScannedItems} />
            )}
            {activeTab === 'recipes' && (
              <RecipesTab
                recipes={recipes}
                onAddRecipe={addRecipe}
                onUpdateIngredients={updateRecipeIngredients}
              />
            )}
            {activeTab === 'shopping' && (
              <ShoppingTab
                items={shopping}
                onToggle={toggleShoppingItem}
                onDelete={deleteShoppingItem}
                onAdd={addShoppingItem}
                onGenerate={generateShoppingList}
                generating={generatingShopping}
              />
            )}
            {activeTab === 'master' && (
              <MasterShoppingTab
                items={masterShopping}
                onUpdateStore={updateMasterStore}
                onAddItem={addMasterItem}
              />
            )}
          </>
        )}
      </main>

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
