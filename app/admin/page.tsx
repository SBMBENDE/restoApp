'use client'

import { useEffect, useState } from 'react'
import { IMenuItem } from '@/models/MenuItem'
import { IOrder } from '@/models/Order'
import { IBill } from '@/models/Bill'
import { Pencil, Trash2, Plus, Settings, Receipt, GitMerge } from 'lucide-react'
import toast from 'react-hot-toast'

interface IBillWithOrders extends IBill {
  orders: IOrder[]
  total: number
}

const EMPTY_FORM: Omit<IMenuItem, '_id'> = {
  name: '',
  description: '',
  price: 0,
  category: '',
  image: '',
  available: true,
}

const CATEGORIES_ORDER = ['Plats', 'Accompagnements', 'Braise', 'Vins', 'Champagnes', 'Bières', 'Boissons']

export default function AdminPage() {
  const [tab, setTab] = useState<'menu' | 'bills'>('menu')
  const [items, setItems] = useState<IMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<IMenuItem, '_id'>>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Bills state
  const [bills, setBills] = useState<IBillWithOrders[]>([])
  const [paidBills, setPaidBills] = useState<IBillWithOrders[]>([])
  const [billsLoading, setBillsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [mergeTarget, setMergeTarget] = useState<string>('')
  const [mergeSource, setMergeSource] = useState<string>('')
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch('/api/menu')
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data: IMenuItem[] = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Could not load menu items.')
      } finally {
        setLoading(false)
      }
    }
    loadMenu()
  }, [])

  async function loadBills() {
    setBillsLoading(true)
    try {
      const [openRes, paidRes] = await Promise.all([
        fetch('/api/bills?status=open', { cache: 'no-store' }),
        fetch('/api/bills?status=paid', { cache: 'no-store' }),
      ])
      if (!openRes.ok || !paidRes.ok) throw new Error()
      const [openData, paidData]: [IBillWithOrders[], IBillWithOrders[]] = await Promise.all([
        openRes.json(),
        paidRes.json(),
      ])
      setBills(openData)
      setPaidBills(paidData)
    } catch {
      toast.error('Could not load bills.')
    } finally {
      setBillsLoading(false)
    }
  }

  async function markPaid(billId: string) {
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Bill marked as paid.')
      loadBills()
    } catch {
      toast.error('Failed to update bill.')
    }
  }

  async function mergeBills() {
    if (!mergeTarget || !mergeSource) {
      toast.error('Select both bills to merge.')
      return
    }
    if (mergeTarget === mergeSource) {
      toast.error('Cannot merge a bill with itself.')
      return
    }
    setMerging(true)
    try {
      const res = await fetch('/api/bills/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetBillId: mergeTarget, sourceBillId: mergeSource }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Tables merged successfully.')
      setMergeTarget('')
      setMergeSource('')
      loadBills()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Merge failed.')
    } finally {
      setMerging(false)
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(item: IMenuItem) {
    const { _id, ...rest } = item
    setForm(rest)
    setEditingId(String(_id))
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editingId ? `/api/menu/${editingId}` : '/api/menu'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(editingId ? 'Item updated!' : 'Item added!')
      setShowForm(false)
      // Reload menu
      const updated = await fetch('/api/menu')
      if (updated.ok) {
        const data: IMenuItem[] = await updated.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error('Failed to save item.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((i) => String(i._id) !== id))
      toast.success('Item deleted.')
    } catch {
      toast.error('Delete failed.')
    }
  }

  async function toggleAvailable(item: IMenuItem) {
    const id = String(item._id)
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) =>
        prev.map((i) => (String(i._id) === id ? { ...i, available: !item.available } : i))
      )
      toast.success(`${item.name} marked as ${!item.available ? 'available' : 'unavailable'}.`)
    } catch {
      toast.error('Failed to update availability.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-amber-500" />
          <h1 className="text-xl font-bold text-gray-800">Le KIRA — Admin</h1>
        </div>
        <div className="flex gap-3">
          {tab === 'menu' && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 text-sm px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
            >
              <Plus size={16} />
              Add Item
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex gap-1">
        <button
          onClick={() => setTab('menu')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'menu' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings size={15} />
          Menu
        </button>
        <button
          onClick={() => { setTab('bills'); loadBills() }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'bills' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Receipt size={15} />
          Bills
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* ── MENU TAB ────────────────────────────────── */}
        {tab === 'menu' && (
          <>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Available</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...CATEGORIES_ORDER,
                  ...items
                    .map((i) => i.category)
                    .filter((c, idx, arr) => !CATEGORIES_ORDER.includes(c) && arr.indexOf(c) === idx),
                ].flatMap((cat) => {
                  const group = items.filter((i) => i.category === cat)
                  if (group.length === 0) return []
                  return [
                    <tr key={`header-${cat}`} className="bg-amber-50 border-b">
                      <td colSpan={5} className="px-4 py-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                        {cat}
                      </td>
                    </tr>,
                    ...group.map((item) => (
                      <tr key={String(item._id)} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.category}</td>
                        <td className="px-4 py-3 text-amber-600 font-semibold">
                          €{item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleAvailable(item)}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                              item.available
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {item.available ? '✓ Available' : '✗ Unavailable'}
                          </button>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 hover:bg-amber-50 text-amber-500 rounded-lg transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(String(item._id))}
                            className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    )),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {/* ── BILLS TAB ───────────────────────────────── */}
        {tab === 'bills' && (
          <div className="space-y-6">

            {/* Merge panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <GitMerge size={18} className="text-amber-500" />
                Merge Tables
              </h2>
              {bills.length < 2 ? (
                <p className="text-sm text-gray-400">At least 2 open bills are required to merge.</p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Keep this bill (target)</label>
                    <select
                      value={mergeTarget}
                      onChange={(e) => setMergeTarget(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Select bill…</option>
                      {bills.map((b) => (
                        <option key={String(b._id)} value={String(b._id)}>
                          Tables {b.tableIds.map((t) => `T-${t}`).join(', ')} — €{b.total.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Merge into it (source)</label>
                    <select
                      value={mergeSource}
                      onChange={(e) => setMergeSource(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Select bill…</option>
                      {bills
                        .filter((b) => String(b._id) !== mergeTarget)
                        .map((b) => (
                          <option key={String(b._id)} value={String(b._id)}>
                            Tables {b.tableIds.map((t) => `T-${t}`).join(', ')} — €{b.total.toFixed(2)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    onClick={mergeBills}
                    disabled={merging || !mergeTarget || !mergeSource}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm rounded-xl font-medium transition-colors whitespace-nowrap"
                  >
                    <GitMerge size={15} />
                    {merging ? 'Merging…' : 'Merge'}
                  </button>
                </div>
              )}
            </div>

            {/* Bills list */}
            {billsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : bills.length === 0 ? (
              <p className="text-gray-400 text-center py-16">No open bills.</p>
            ) : (
              <div className="space-y-4">
                {bills.map((bill) => (
                  <div key={String(bill._id)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-bold text-gray-800">
                          {bill.tableIds.map((t) => `Table ${t}`).join(' + ')}
                        </span>
                        <span className="ml-3 text-xs text-gray-400">
                          {bill.orders.length} order{bill.orders.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-amber-500">€{bill.total.toFixed(2)}</span>
                        <button
                          onClick={() => markPaid(String(bill._id))}
                          className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
                      {bill.orders.map((o) => (
                        <li key={String(o._id)} className="flex justify-between">
                          <span>
                            T-{o.tableId} · {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                          </span>
                          <span className="text-gray-400">€{o.total.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Paid Bills History */}
            <div className="mt-6">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                <span>{showHistory ? '▾' : '▸'}</span>
                Paid Bills History ({paidBills.length})
              </button>

              {showHistory && (
                <div className="mt-3 space-y-3">
                  {paidBills.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No paid bills yet.</p>
                  ) : (
                    paidBills.map((bill) => (
                      <div key={String(bill._id)} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 opacity-75">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-semibold text-gray-600">
                              {bill.tableIds.map((t) => `Table ${t}`).join(' + ')}
                            </span>
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              Paid
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {bill.closedAt ? new Date(bill.closedAt).toLocaleString() : ''}
                            </span>
                          </div>
                          <span className="text-base font-bold text-gray-500">€{bill.total.toFixed(2)}</span>
                        </div>
                        <ul className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-2">
                          {bill.orders.map((o) => (
                            <li key={String(o._id)} className="flex justify-between">
                              <span>T-{o.tableId} · {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</span>
                              <span>€{o.total.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">
              {editingId ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(
                [
                  { key: 'name', label: 'Name', type: 'text' },
                  { key: 'description', label: 'Description', type: 'text' },
                  { key: 'price', label: 'Price', type: 'number' },
                  { key: 'category', label: 'Category', type: 'text' },
                  { key: 'image', label: 'Image URL', type: 'url' },
                ] as const
              ).map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    step={key === 'price' ? '0.01' : undefined}
                    value={String(form[key])}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [key]: key === 'price' ? parseFloat(e.target.value) || 0 : e.target.value,
                      }))
                    }
                    required={key !== 'image'}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={form.available}
                  onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="available" className="text-sm text-gray-700">
                  Available
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-medium transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
