'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from './CartDrawer'

export default function CartButton() {
  const itemCount = useCartStore((s) => s.itemCount())
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-colors"
        aria-label="Open cart"
      >
        <ShoppingCart size={22} />
        {mounted && itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
