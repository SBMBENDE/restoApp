import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Order } from '@/models/Order'

export async function GET() {
  try {
    await connectDB()
    const orders = await Order.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json(orders)
  } catch (err) {
    console.error('[GET /api/orders]', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { tableId, items } = body

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 })
    }

    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    )

    const order = await Order.create({ tableId, items, total, status: 'pending' })
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
