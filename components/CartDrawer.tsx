'use client'

import { useState } from 'react'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useLangStore, useT } from '@/store/langStore'
import toast from 'react-hot-toast'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, tableId, updateQuantity, removeItem, clearCart, total } = useCartStore()
  const t = useT()
  const [placing, setPlacing] = useState(false)

  async function placeOrder() {
    if (items.length === 0) return
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          items: items.map(({ _id, name, price, quantity }) => ({
            menuItemId: _id,
            name,
            price,
            quantity,
          })),
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error((errBody as { error?: string }).error ?? 'Failed to place order')
      }
      clearCart()
      onClose()
      toast.success(t.cart.success)
    } catch {
      toast.error(t.cart.error)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={20} className="text-amber-500" />
            {t.cart.title.replace('{tableId}', tableId)}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">{t.cart.empty}</p>
          ) : (
            items.map((item) => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">
                    {t.itemNames[item.name as keyof typeof t.itemNames] ?? item.name}
                  </p>
                  <p className="text-amber-600 text-sm">€{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item._id!, item.quantity - 1)}
                    className="text-gray-600 hover:text-gray-900 font-bold px-1"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id!, item.quantity + 1)}
                    className="text-gray-600 hover:text-gray-900 font-bold px-1"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item._id!)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t space-y-3">
            <div className="flex justify-between font-bold text-gray-800 text-lg">
              <span>{t.cart.total}</span>
              <span>€{total().toFixed(2)}</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {placing ? t.cart.placing : t.cart.placeOrder}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
