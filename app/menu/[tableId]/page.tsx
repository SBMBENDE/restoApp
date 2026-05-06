'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { IMenuItem } from '@/models/MenuItem'
import { useCartStore } from '@/store/cartStore'
import { useLangStore, useT } from '@/store/langStore'
import MenuItemCard from '@/components/MenuItemCard'
import CartButton from '@/components/CartButton'
import LanguageToggle from '@/components/LanguageToggle'
import Image from 'next/image'
import { BellRing, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES_ORDER = ['Plats', 'Braise', 'Accompagnements', 'Boissons', 'Bières', 'Vins', 'Champagnes']

export default function MenuPage() {
  const params = useParams()
  const tableId = Array.isArray(params.tableId) ? params.tableId[0] : (params.tableId ?? '1')

  const setTableId = useCartStore((s) => s.setTableId)
  const t = useT()
  const [menu, setMenu] = useState<IMenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('__all__')
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<'call_waiter' | 'request_bill' | null>(null)

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
    '__all__',
    ...CATEGORIES_ORDER.filter((c) => menu.some((item) => item.category === c)),
    ...menu
      .map((item) => item.category)
      .filter((c, i, arr) => !CATEGORIES_ORDER.includes(c) && arr.indexOf(c) === i),
  ]

  const filtered =
    activeCategory === '__all__' ? menu : menu.filter((item) => item.category === activeCategory)

  async function sendRequest(type: 'call_waiter' | 'request_bill') {
    setRequesting(type)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, type }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        type === 'call_waiter' ? t.requests.callSent : t.requests.billSent,
        { icon: type === 'call_waiter' ? '🔔' : '🧾' }
      )
    } catch {
      toast.error(t.requests.error)
    } finally {
      setRequesting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex flex-col items-center">
            <Image
              src="https://res.cloudinary.com/dkd3k6eau/image/upload/v1777656884/logo_idrmeb.png"
              alt="Le KIRA"
              width={64}
              height={64}
              className="rounded-full"
            />
            <p className="text-xs font-semibold text-gray-500 mt-1">{t.table} {tableId}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <CartButton />
          </div>
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
                {cat === '__all__' ? t.all : (t.categories[cat as keyof typeof t.categories] ?? cat)}
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
          <p className="text-center text-gray-400 mt-20">{t.noItems}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <MenuItemCard key={String(item._id)} item={item} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-300 py-6 pb-28">
        {t.footer.replace('{year}', String(new Date().getFullYear()))}
      </footer>

      {/* Sticky CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={() => sendRequest('call_waiter')}
            disabled={requesting !== null}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-semibold text-sm transition-all disabled:opacity-60"
          >
            <BellRing size={18} />
            {requesting === 'call_waiter' ? t.requests.sending : t.requests.callWaiter}
          </button>
          <button
            onClick={() => sendRequest('request_bill')}
            disabled={requesting !== null}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-sm transition-all disabled:opacity-60"
          >
            <Receipt size={18} />
            {requesting === 'request_bill' ? t.requests.sending : t.requests.requestBill}
          </button>
        </div>
      </div>
    </div>
  )
}
