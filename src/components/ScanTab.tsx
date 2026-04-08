'use client'

import { useState, useRef } from 'react'
import type { ScanResult } from '@/lib/types'

interface ScanTabProps {
  onItemsScanned: (items: ScanResult[]) => void
}

export function ScanTab({ onItemsScanned }: ScanTabProps) {
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<ScanResult[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (file: File, maxWidth = 1280, quality = 0.7): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]
        resolve({ base64, mimeType: 'image/jpeg' })
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setResults([])
    setScanning(true)

    // Preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    try {
      // Compress image to stay under Vercel's 4.5MB body limit
      const { base64, mimeType } = await compressImage(file)

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '识别失败')
        return
      }

      setResults(json.data)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setScanning(false)
    }
  }

  const handleConfirm = () => {
    const count = results.length
    onItemsScanned(results)
    setResults([])
    setPreview(null)
    setSuccess(`已添加 ${count} 种食材到库存`)
    // 重置 file input，允许再次上传同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancel = () => {
    setResults([])
    setPreview(null)
    setError('')
    setSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRetake = () => {
    setResults([])
    setError('')
    setSuccess('')
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // 触发重新选择文件
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const locationLabels: Record<string, string> = {
    freezer: '冰柜',
    fridge: '冰箱',
    pantry: '常温',
  }

  return (
    <div>
      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer active:bg-gray-50 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="预览" className="max-h-48 mx-auto rounded-lg mb-3" />
        ) : (
          <div className="text-gray-400">
            <span className="text-4xl block mb-2">📷</span>
            <p className="font-medium">点击拍照或选择图片</p>
            <p className="text-xs mt-1">拍一张冰箱/冰柜内部照片</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Scanning state */}
      {scanning && (
        <div className="mt-4 text-center text-amber-700 font-medium">
          <p>🔍 AI 正在识别食材...</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          ✅ {success}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            识别到 {results.length} 种食材
          </h3>
          <div className="space-y-2">
            {results.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                <span className="font-medium text-sm">{item.name}</span>
                <span className="text-xs text-gray-400">
                  {item.qty}{item.unit} · {locationLabels[item.location] || item.location}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm active:bg-gray-200"
            >
              取消
            </button>
            <button
              onClick={handleRetake}
              className="flex-1 py-3 bg-amber-100 text-amber-700 rounded-xl font-medium text-sm active:bg-amber-200"
            >
              📷 重拍
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm active:bg-green-700"
            >
              ✅ 确认
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
