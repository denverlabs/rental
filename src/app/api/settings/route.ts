import { NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/data'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const settings = await getSettings()
    // Don't expose admin password in API response
    const { adminPassword, ...publicSettings } = settings
    return NextResponse.json(publicSettings, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const currentSettings = await getSettings()

    // Preserve the admin password if not provided in update
    const updatedSettings = {
      ...currentSettings,
      ...body,
      adminPassword: body.adminPassword || currentSettings.adminPassword
    }

    const success = await saveSettings(updatedSettings)

    if (!success) {
      return NextResponse.json({ error: 'Error saving settings' }, { status: 500 })
    }

    // Return without password
    const { adminPassword, ...publicSettings } = updatedSettings
    return NextResponse.json(publicSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Error updating settings' }, { status: 500 })
  }
}
