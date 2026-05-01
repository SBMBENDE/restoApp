'use client'

import Image from 'next/image'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { IMenuItem } from '@/models/MenuItem'
import { useCartStore } from '@/store/cartStore'

export default function MenuItemCard({ item }: { item: IMenuItem }) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find((i) => i._id === item._id)
  const qty = cartItem?.quantity ?? 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-44 w-full bg-gray-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-4xl">🍽️</div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 leading-tight">{item.name}</h3>
          <span className="text-amber-600 font-bold whitespace-nowrap">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 leading-snug line-clamp-2">{item.description}</p>

        {qty === 0 ? (
          <button
            onClick={() => addItem(item)}
            className="mt-2 flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-medium transition-colors"
          >
            <ShoppingCart size={16} />
            Add to cart
          </button>
        ) : (
          <div className="mt-2 flex items-center justify-between bg-amber-50 rounded-xl px-2 py-1">
            <button
              onClick={() => updateQuantity(item._id!, qty - 1)}
              className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <Minus size={16} className="text-amber-600" />
            </button>
            <span className="font-bold text-amber-700 w-6 text-center">{qty}</span>
            <button
              onClick={() => addItem(item)}
              className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <Plus size={16} className="text-amber-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
