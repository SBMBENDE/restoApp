import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuItem } from '@/models/MenuItem'

export async function GET() {
  try {
    await connectDB()
    const items = await MenuItem.find({}).lean()
    return NextResponse.json(items)
  } catch (err) {
    console.error('[GET /api/menu]', err)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const item = await MenuItem.create(body)
    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error('[POST /api/menu]', err)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
