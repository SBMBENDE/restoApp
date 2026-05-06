import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TableRequest } from '@/models/TableRequest'
import { Bill } from '@/models/Bill'
import { Order } from '@/models/Order'

export const dynamic = 'force-dynamic'

// GET /api/requests?status=pending|done|all
// Returns requests; for request_bill type, inlines the open bill total for that table
export async function GET(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'pending'

    const query = status === 'all' ? {} : { status: status as 'pending' | 'done' }
    const requests = await TableRequest.find(query).sort({ createdAt: -1 }).lean()

    // For bill requests, look up the open bill total per table
    const billTableIds = [
      ...new Set(
        requests
          .filter((r) => r.type === 'request_bill')
          .map((r) => r.tableId)
      ),
    ]

    const billTotals: Record<string, number> = {}

    if (billTableIds.length > 0) {
      const openBills = await Bill.find({
        tableIds: { $in: billTableIds },
        status: 'open',
      }).lean()

      const openBillIds = openBills.map((b) => String(b._id))
      const orders = await Order.find({ billId: { $in: openBillIds } }).lean()

      // Map billId → total
      const billTotalById: Record<string, number> = {}
      for (const order of orders) {
        const key = order.billId!
        billTotalById[key] = (billTotalById[key] ?? 0) + order.total
      }

      // Map tableId → total (using the open bill for that table)
      for (const bill of openBills) {
        const total = billTotalById[String(bill._id)] ?? 0
        for (const tid of bill.tableIds) {
          if (billTableIds.includes(tid)) {
            billTotals[tid] = total
          }
        }
      }
    }

    const result = requests.map((r) => ({
      ...r,
      billTotal: r.type === 'request_bill' ? (billTotals[r.tableId] ?? null) : undefined,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/requests]', err)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

// POST /api/requests  { tableId, type }
export async function POST(req: Request) {
  try {
    await connectDB()
    const body = await req.json()
    const { tableId, type } = body

    if (!tableId || !['call_waiter', 'request_bill'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Prevent duplicate pending requests of the same type for the same table
    const existing = await TableRequest.findOne({ tableId, type, status: 'pending' })
    if (existing) {
      return NextResponse.json(existing)
    }

    const request = await TableRequest.create({ tableId, type })
    return NextResponse.json(request, { status: 201 })
  } catch (err) {
    console.error('[POST /api/requests]', err)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
