import { NextResponse } from 'next/server'
import { getProperties, saveProperties, createProperty } from '@/lib/data'
import type { Property } from '@/types'

export async function GET() {
  try {
    const properties = await getProperties()
    return NextResponse.json(properties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({ error: 'Error fetching properties' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newProperty = await createProperty(body)
    return NextResponse.json(newProperty, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json({ error: 'Error creating property' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const properties: Property[] = await request.json()
    await saveProperties(properties)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating properties:', error)
    return NextResponse.json({ error: 'Error updating properties' }, { status: 500 })
  }
}
