'use client'

import { useEffect, useState } from 'react'
import { IOrder, OrderStatus } from '@/models/Order'
import StatusBadge from '@/components/StatusBadge'
import { ChefHat, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing',
  preparing: 'served',
  served: null,
}

const NEXT_LABEL: Record<OrderStatus, string> = {
  pending: 'Start Preparing',
  preparing: 'Mark as Served',
  served: '',
}

const POLL_INTERVAL = 8000

export default function KitchenPage() {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: IOrder[] = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Could not load orders — check your connection')
      console.error('[fetchOrders]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data: IOrder[] = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        toast.error('Could not load orders — check your connection')
        console.error('[fetchOrders]', err)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  async function advanceStatus(order: IOrder) {
    const next = STATUS_FLOW[order.status]
    if (!next) return
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error()
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: next } : o))
      )
      toast.success(`Order #${String(order._id).slice(-5)} → ${next}`)
    } catch {
      toast.error('Failed to update order status')
    }
  }

  const displayed =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    served: orders.filter((o) => o.status === 'served').length,
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={28} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Le KIRA — Kitchen</h1>
            <p className="text-xs text-gray-400">Updates every {POLL_INTERVAL / 1000}s</p>
          </div>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      {/* Filter tabs */}
      <div className="px-6 pt-5 flex gap-3 flex-wrap">
        {(['all', 'pending', 'preparing', 'served'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === s
                ? 'bg-amber-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Orders grid */}
      <main className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse" />
          ))
        ) : displayed.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center mt-20">No orders here.</p>
        ) : (
          displayed.map((order) => (
            <div
              key={String(order._id)}
              className="bg-gray-800 rounded-2xl p-5 flex flex-col gap-3 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-400">
                  #{String(order._id).slice(-6).toUpperCase()}
                </span>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-400">T-{order.tableId}</span>
                <span className="text-sm text-gray-400">
                  {new Date(order.createdAt!).toLocaleTimeString()}
                </span>
              </div>

              <ul className="text-sm text-gray-300 space-y-1 border-t border-gray-700 pt-3">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span className="text-gray-400">€{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-white">€{order.total.toFixed(2)}</span>
                {STATUS_FLOW[order.status] && (
                  <button
                    onClick={() => advanceStatus(order)}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-1.5 rounded-xl font-medium transition-colors"
                  >
                    {NEXT_LABEL[order.status]}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
