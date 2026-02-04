import { NextResponse } from 'next/server'
import { getGuests, createGuest, findGuestByPhone } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  try {
    if (phone) {
      // Search by phone (for bot)
      const guest = await findGuestByPhone(phone)
      return NextResponse.json(guest || null)
    }

    const guests = await getGuests()
    return NextResponse.json(guests)
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const guest = await createGuest(body)
    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    console.error('Error creating guest:', error)
    return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 })
  }
}
