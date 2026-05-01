import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Order } from '@/models/Order'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['pending', 'preparing', 'served']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true })
    if (!updated) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
