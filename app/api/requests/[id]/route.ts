import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TableRequest } from '@/models/TableRequest'

export const dynamic = 'force-dynamic'

// PATCH /api/requests/[id]  { status: 'done' }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!['pending', 'done'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await TableRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean()

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/requests/[id]]', err)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
