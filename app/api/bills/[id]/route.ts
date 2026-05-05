import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Bill } from '@/models/Bill'
import { Order } from '@/models/Order'

// GET /api/bills/[id] — get a single bill with all its orders and total
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const bill = await Bill.findById(id).lean()
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

    const orders = await Order.find({ billId: id }).lean()
    const total = orders.reduce((sum, o) => sum + o.total, 0)

    return NextResponse.json({ ...bill, orders, total })
  } catch (err) {
    console.error('[GET /api/bills/[id]]', err)
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 })
  }
}

// PATCH /api/bills/[id] — mark bill as paid
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['open', 'paid']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const update: Record<string, unknown> = { status }
    if (status === 'paid') update.closedAt = new Date()

    const updated = await Bill.findByIdAndUpdate(id, update, { new: true })
    if (!updated) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/bills/[id]]', err)
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
  }
}
