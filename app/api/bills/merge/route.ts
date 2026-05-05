import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Bill } from '@/models/Bill'
import { Order } from '@/models/Order'

// POST /api/bills/merge
// Body: { targetBillId: string, sourceBillId: string }
// Moves all orders from sourceBill into targetBill, then deletes sourceBill.
// Order history is fully preserved — only billId is updated.
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { targetBillId, sourceBillId } = await req.json()

    if (!targetBillId || !sourceBillId) {
      return NextResponse.json({ error: 'targetBillId and sourceBillId are required' }, { status: 400 })
    }
    if (targetBillId === sourceBillId) {
      return NextResponse.json({ error: 'Cannot merge a bill with itself' }, { status: 400 })
    }

    const [target, source] = await Promise.all([
      Bill.findById(targetBillId),
      Bill.findById(sourceBillId),
    ])

    if (!target) return NextResponse.json({ error: 'Target bill not found' }, { status: 404 })
    if (!source) return NextResponse.json({ error: 'Source bill not found' }, { status: 404 })
    if (target.status === 'paid') return NextResponse.json({ error: 'Target bill is already paid' }, { status: 400 })
    if (source.status === 'paid') return NextResponse.json({ error: 'Source bill is already paid' }, { status: 400 })

    // Reassign all source orders to the target bill
    await Order.updateMany({ billId: sourceBillId }, { billId: targetBillId })

    // Merge table IDs (deduplicated)
    const mergedTableIds = [...new Set([...target.tableIds, ...source.tableIds])]
    target.tableIds = mergedTableIds
    await target.save()

    // Delete the source bill (orders are preserved, just re-pointed)
    await Bill.findByIdAndDelete(sourceBillId)

    // Return the updated target bill with its orders
    const orders = await Order.find({ billId: targetBillId }).lean()
    const total = orders.reduce((sum, o) => sum + o.total, 0)

    return NextResponse.json({ ...target.toObject(), orders, total })
  } catch (err) {
    console.error('[POST /api/bills/merge]', err)
    return NextResponse.json({ error: 'Failed to merge bills' }, { status: 500 })
  }
}
