'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { IMenuItem } from '@/models/MenuItem'
import { useCartStore } from '@/store/cartStore'
import MenuItemCard from '@/components/MenuItemCard'
import CartButton from '@/components/CartButton'
import { UtensilsCrossed } from 'lucide-react'

const CATEGORIES_ORDER = ['Plats', 'Braise', 'Accompagnements', 'Boissons', 'Bières', 'Vins', 'Champagnes']

export default function MenuPage() {
  const params = useParams()
  const tableId = Array.isArray(params.tableId) ? params.tableId[0] : (params.tableId ?? '1')

  const setTableId = useCartStore((s) => s.setTableId)
  const [menu, setMenu] = useState<IMenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTableId(tableId)
  }, [tableId, setTableId])

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`)
        return r.json()
      })
      .then((data: IMenuItem[]) => {
        setMenu(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const categories = [
    'All',
    ...CATEGORIES_ORDER.filter((c) => menu.some((item) => item.category === c)),
    ...menu
      .map((item) => item.category)
      .filter((c, i, arr) => !CATEGORIES_ORDER.includes(c) && arr.indexOf(c) === i),
  ]

  const filtered =
    activeCategory === 'All' ? menu : menu.filter((item) => item.category === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="text-amber-500" size={28} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Le KIRA</h1>
              <p className="text-xs text-gray-400">Table {tableId}</p>
            </div>
          </div>
          <CartButton />
        </div>

        {/* Category tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Grid */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 mt-20">No items in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <MenuItemCard key={String(item._id)} item={item} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-300 py-6">
        © {new Date().getFullYear()} Le KIRA · Fine Dining
      </footer>
    </div>
  )
}
