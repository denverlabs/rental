import { NextResponse } from 'next/server'
import { importAirbnb } from '@/lib/data'

export async function POST(request: Request) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        const data = await importAirbnb(url)

        if (!data) {
            return NextResponse.json({ error: 'Failed to import from Airbnb' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in import-airbnb route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
