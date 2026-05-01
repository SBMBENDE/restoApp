import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { IMenuItem } from '@/models/MenuItem'

export interface CartItem extends IMenuItem {
  quantity: number
}

interface CartState {
  items: CartItem[]
  tableId: string
  setTableId: (id: string) => void
  addItem: (item: IMenuItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: '',

      setTableId: (id) => set({ tableId: id }),

      addItem: (item) => {
        const existing = get().items.find((i) => i._id === item._id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] })
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i._id !== id) }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
        } else {
          set({
            items: get().items.map((i) =>
              i._id === id ? { ...i, quantity } : i
            ),
          })
        }
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'lekira-cart' }
  )
)
