'use client'

import { useEffect, useState } from 'react'
import { IMenuItem } from '@/models/MenuItem'
import { Pencil, Trash2, Plus, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [items, setItems] = useState<IMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<IMenuItem, '_id'>>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

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
          <button
            onClick={openAdd}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name', 'Category', 'Price', 'Available', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">
                      {h}
                    </th>
                  ))}
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
                        <td className="px-4 py-3 text-gray-500">{item.category}</td>
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
