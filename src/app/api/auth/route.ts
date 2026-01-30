import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/data'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const settings = await getSettings()

    if (password === settings.adminPassword) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (error) {
    console.error('Error authenticating:', error)
    return NextResponse.json({ error: 'Error authenticating' }, { status: 500 })
  }
}
