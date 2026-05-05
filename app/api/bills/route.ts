import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Bill } from '@/models/Bill'
import { Order } from '@/models/Order'

export const dynamic = 'force-dynamic'

// GET /api/bills — list all open bills with their orders and computed total
export async function GET() {
  try {
    await connectDB()
    const bills = await Bill.find({ status: 'open' }).sort({ createdAt: -1 }).lean()

    const billIds = bills.map((b) => String(b._id))
    const orders = await Order.find({ billId: { $in: billIds } }).lean()

    const ordersMap: Record<string, typeof orders> = {}
    for (const order of orders) {
      const key = order.billId!
      if (!ordersMap[key]) ordersMap[key] = []
      ordersMap[key].push(order)
    }

    const result = bills.map((bill) => {
      const billOrders = ordersMap[String(bill._id)] ?? []
      const total = billOrders.reduce((sum, o) => sum + o.total, 0)
      return { ...bill, orders: billOrders, total }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/bills]', err)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}
