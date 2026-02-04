import { NextResponse } from 'next/server'
import { getReservations, createReservation, getActiveReservations, getTodayCheckIns, getTodayCheckOuts } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter')

  try {
    let reservations

    switch (filter) {
      case 'active':
        reservations = await getActiveReservations()
        break
      case 'today-checkins':
        reservations = await getTodayCheckIns()
        break
      case 'today-checkouts':
        reservations = await getTodayCheckOuts()
        break
      default:
        reservations = await getReservations()
    }

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const reservation = await createReservation(body)
    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}
