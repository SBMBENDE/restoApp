'use client'

import Image from 'next/image'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { IMenuItem } from '@/models/MenuItem'
import { useCartStore } from '@/store/cartStore'

export default function MenuItemCard({ item }: { item: IMenuItem }) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find((i) => i._id === item._id)
  const qty = cartItem?.quantity ?? 0
  const unavailable = !item.available

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow ${unavailable ? 'opacity-60' : ''}`}>
      <div className="relative h-44 w-full bg-gray-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={`object-cover ${unavailable ? 'grayscale' : ''}`}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-4xl">🍽️</div>
        )}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 leading-tight">{item.name}</h3>
          <span className="text-amber-600 font-bold whitespace-nowrap">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 leading-snug line-clamp-2">{item.description}</p>

        {unavailable ? (
          <button
            disabled
            className="mt-2 flex items-center justify-center gap-2 w-full bg-gray-200 text-gray-400 py-2 rounded-xl font-medium cursor-not-allowed"
          >
            Unavailable
          </button>
        ) : qty === 0 ? (
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
