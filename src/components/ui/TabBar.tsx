'use client'

export type Tab = 'pantry' | 'scan' | 'recipes' | 'shopping' | 'master'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'pantry', label: '食材库', icon: '🧊' },
  { id: 'scan', label: '拍照', icon: '📸' },
  { id: 'recipes', label: '菜谱', icon: '📖' },
  { id: 'shopping', label: '购物', icon: '🛒' },
  { id: 'master', label: 'Master', icon: '📋' },
]

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="max-w-[480px] mx-auto flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 min-h-[56px] transition-colors ${
              activeTab === tab.id
                ? 'text-amber-700 font-semibold'
                : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
