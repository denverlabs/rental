import { NextResponse } from 'next/server'
import { getGuest, updateGuest, deleteGuest } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guest = await getGuest(params.id)
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }
    return NextResponse.json(guest)
  } catch (error) {
    console.error('Error fetching guest:', error)
    return NextResponse.json({ error: 'Failed to fetch guest' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const guest = await updateGuest(params.id, body)
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }
    return NextResponse.json(guest)
  } catch (error) {
    console.error('Error updating guest:', error)
    return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteGuest(params.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting guest:', error)
    return NextResponse.json({ error: 'Failed to delete guest' }, { status: 500 })
  }
}
