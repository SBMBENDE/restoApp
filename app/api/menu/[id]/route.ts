import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuItem } from '@/models/MenuItem'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const updated = await MenuItem.findByIdAndUpdate(id, body, { new: true })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PUT /api/menu/[id]]', err)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const updated = await MenuItem.findByIdAndUpdate(id, { $set: body }, { new: true })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/menu/[id]]', err)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    await MenuItem.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/menu/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
