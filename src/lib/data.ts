import type { Property, SiteSettings } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rond-point-rentals-ai-kx5aus62lq-uc.a.run.app'

// Helper to fetch from API
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`}`
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        ...options?.headers,
      },
    })

    if (response.ok) {
      return await response.json()
    }
    console.error(`API error on ${endpoint}:`, response.status, response.statusText)
  } catch (error) {
    console.error(`Fetch error on ${endpoint}:`, error)
  }
  return null
}

// SETTINGS
export async function getSettings(): Promise<SiteSettings> {
  const data = await apiFetch<SiteSettings>('settings')
  if (data) {
    console.log('Loaded settings from API')
    return data
  }

  console.error('API Error: Could not load settings')
  throw new Error('Critical: Could not load site settings from API')
}

export async function saveSettings(settings: SiteSettings): Promise<boolean> {
  const result = await apiFetch<{ success: boolean }>('settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
  return !!result?.success
}

// PROPERTIES
export async function getProperties(): Promise<Property[]> {
  const data = await apiFetch<{ properties: Property[] }>('properties')

  if (data?.properties) {
    console.log('Loaded properties from API')
    return data.properties
  }

  if (Array.isArray(data)) {
    return data
  }

  console.warn('API Warning: No properties returned from API')
  return []
}

// Get single property
export async function getProperty(id: string): Promise<Property | undefined> {
  const data = await apiFetch<Property>(`properties/${id}`)
  if (data && !('error' in data)) {
    return data
  }

  return undefined
}

// Create property
export async function createProperty(propertyIdLess: Omit<Property, 'id'>): Promise<Property> {
  const data = await apiFetch<Property>('properties', {
    method: 'POST',
    body: JSON.stringify(propertyIdLess),
  })

  if (data && !('error' in data)) {
    return data
  }

  throw new Error('Could not create property in backend')
}

// Update property
export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  const response = await apiFetch<{ success: boolean }>(`properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })

  if (response?.success) {
    const updated = await getProperty(id)
    return updated || null
  }

  return null
}

// Delete property
export async function deleteProperty(id: string): Promise<boolean> {
  const response = await apiFetch<{ success: boolean }>(`properties/${id}`, {
    method: 'DELETE',
  })
  return !!response?.success
}

// AIRBNB IMPORT
export async function importAirbnb(url: string): Promise<Partial<Property> | null> {
  const data = await apiFetch<Partial<Property>>('properties/import-airbnb', {
    method: 'POST',
    body: JSON.stringify({ url: url.trim() }),
  })

  if (data && !('error' in data)) {
    return data
  }

  return null
}

// Helper to save entire properties list (kept for compatibility, though API handles individual)
export async function saveProperties(properties: Property[]): Promise<boolean> {
  console.warn('saveProperties is deprecated - use create/update/delete instead')
  // This is a rough batch implementation if needed, but the backend prefers individual actions
  for (const property of properties) {
    await updateProperty(property.id, property)
  }
  return true
}
