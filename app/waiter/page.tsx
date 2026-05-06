'use client'

import { useEffect, useState } from 'react'
import { BellRing, Receipt, CheckCheck, RefreshCw, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'

type RequestType = 'call_waiter' | 'request_bill'
type RequestStatus = 'pending' | 'done'

interface TableRequest {
  _id: string
  tableId: string
  type: RequestType
  status: RequestStatus
  billTotal?: number | null
  createdAt: string
}

const POLL_INTERVAL = 5000

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function WaiterPage() {
  const [requests, setRequests] = useState<TableRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending')
  const [now, setNow] = useState(Date.now())

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/requests?status=${filter}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: TableRequest[] = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Could not load requests — check connection')
      console.error('[fetchRequests]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchRequests()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests()
      setNow(Date.now())
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function acknowledge(request: TableRequest) {
    try {
      const res = await fetch(`/api/requests/${request._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      })
      if (!res.ok) throw new Error()
      setRequests((prev) => prev.filter((r) => r._id !== request._id))
      toast.success(
        `Table ${request.tableId} — ${request.type === 'call_waiter' ? 'Call' : 'Bill'} acknowledged`
      )
    } catch {
      toast.error('Failed to acknowledge request')
    }
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserRound size={28} className="text-sky-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Le KIRA — Waiter</h1>
            <p className="text-xs text-gray-400">Updates every {POLL_INTERVAL / 1000}s</p>
          </div>
          {pendingCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {pendingCount}
            </span>
          )}
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      {/* Filter tabs */}
      <div className="px-6 pt-5 flex gap-3">
        {(['pending', 'done', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === s
                ? 'bg-sky-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Request cards */}
      <main className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-800 rounded-2xl animate-pulse" />
          ))
        ) : requests.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center mt-20">
            {filter === 'pending' ? 'No pending requests. All clear!' : 'Nothing here.'}
          </p>
        ) : (
          requests.map((req) => (
            <div
              key={req._id}
              className={`bg-gray-800 rounded-2xl p-5 flex flex-col gap-4 border ${
                req.type === 'request_bill'
                  ? 'border-amber-500/40'
                  : 'border-sky-500/40'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {req.type === 'request_bill' ? (
                    <Receipt size={18} className="text-amber-400 shrink-0" />
                  ) : (
                    <BellRing size={18} className="text-sky-400 shrink-0" />
                  )}
                  <span className="font-semibold text-sm text-white">
                    {req.type === 'request_bill' ? 'Bill Request' : 'Call Waiter'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{timeAgo(req.createdAt)}</span>
              </div>

              {/* Table */}
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-amber-400">T-{req.tableId}</span>

                {/* Bill total — shown only for bill requests */}
                {req.type === 'request_bill' && (
                  <div className="text-right">
                    {req.billTotal != null ? (
                      <>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Current total</p>
                        <p className="text-2xl font-bold text-green-400">
                          €{req.billTotal.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No open bill found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Acknowledge button */}
              {req.status === 'pending' && (
                <button
                  onClick={() => acknowledge(req)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    req.type === 'request_bill'
                      ? 'bg-amber-500 hover:bg-amber-400 text-white'
                      : 'bg-sky-500 hover:bg-sky-400 text-white'
                  }`}
                >
                  <CheckCheck size={16} />
                  Acknowledge
                </button>
              )}

              {req.status === 'done' && (
                <span className="text-xs text-center text-gray-500 italic">Acknowledged</span>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}
