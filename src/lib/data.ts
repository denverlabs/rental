import { put, list, del } from '@vercel/blob'
import type { Property, SiteSettings } from '@/types'

// Default data (used as fallback and initial data)
import defaultSettings from '@/data/settings.json'
import defaultProperties from '@/data/properties.json'

const SETTINGS_KEY = 'data/settings.json'
const PROPERTIES_KEY = 'data/properties.json'

// In-memory cache
let settingsCache: SiteSettings | null = null
let propertiesCache: Property[] | null = null

// Check if Blob is available
function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// Helper to get blob by prefix
async function getBlobByPrefix(prefix: string): Promise<{ url: string } | null> {
  if (!hasBlobToken()) return null

  try {
    const { blobs } = await list({ prefix })
    if (blobs.length > 0) {
      return { url: blobs[0].url }
    }
  } catch (error) {
    console.error('Error listing blobs:', error)
  }
  return null
}

// Helper to fetch JSON from URL
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Error fetching JSON:', error)
  }
  return null
}

// Helper to save JSON to blob
async function saveToBlob(key: string, data: unknown): Promise<boolean> {
  if (!hasBlobToken()) {
    console.log('No BLOB_READ_WRITE_TOKEN, skipping blob save')
    return false
  }

  try {
    // First, try to delete any existing blob with this prefix
    const existing = await getBlobByPrefix(key)
    if (existing) {
      try {
        await del(existing.url)
      } catch (e) {
        console.log('Could not delete existing blob:', e)
      }
    }

    // Save new blob
    const blob = await put(key, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })

    console.log('Saved to blob:', blob.url)
    return true
  } catch (error) {
    console.error('Error saving to blob:', error)
    return false
  }
}

// SETTINGS
export async function getSettings(): Promise<SiteSettings> {
  // Return cache if available
  if (settingsCache) {
    return settingsCache
  }

  // Try to get from blob
  if (hasBlobToken()) {
    const blob = await getBlobByPrefix(SETTINGS_KEY)
    if (blob) {
      const data = await fetchJson<SiteSettings>(blob.url)
      if (data) {
        settingsCache = data
        return data
      }
    }
  }

  // Return defaults
  settingsCache = defaultSettings as SiteSettings
  return settingsCache
}

export async function saveSettings(settings: SiteSettings): Promise<boolean> {
  // Always update cache
  settingsCache = settings

  // Try to save to blob
  const saved = await saveToBlob(SETTINGS_KEY, settings)

  // Return true even if blob save failed (cache is updated)
  return true
}

// PROPERTIES
export async function getProperties(): Promise<Property[]> {
  // Return cache if available
  if (propertiesCache) {
    return propertiesCache
  }

  // Try to get from blob
  if (hasBlobToken()) {
    const blob = await getBlobByPrefix(PROPERTIES_KEY)
    if (blob) {
      const data = await fetchJson<Property[]>(blob.url)
      if (data) {
        propertiesCache = data
        return data
      }
    }
  }

  // Return defaults
  propertiesCache = defaultProperties as Property[]
  return propertiesCache
}

export async function saveProperties(properties: Property[]): Promise<boolean> {
  // Always update cache
  propertiesCache = properties

  // Try to save to blob
  await saveToBlob(PROPERTIES_KEY, properties)

  return true
}

export async function getProperty(id: string): Promise<Property | undefined> {
  const properties = await getProperties()
  return properties.find(p => p.id === id)
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  const properties = await getProperties()
  const index = properties.findIndex(p => p.id === id)
  if (index === -1) return null

  properties[index] = { ...properties[index], ...updates }
  await saveProperties(properties)
  return properties[index]
}

export async function createProperty(property: Omit<Property, 'id'>): Promise<Property> {
  const properties = await getProperties()
  const newProperty: Property = {
    ...property,
    id: `prop-${Date.now()}`
  }
  properties.push(newProperty)
  await saveProperties(properties)
  return newProperty
}

export async function deleteProperty(id: string): Promise<boolean> {
  const properties = await getProperties()
  const filtered = properties.filter(p => p.id !== id)
  if (filtered.length === properties.length) return false

  await saveProperties(filtered)
  return true
}

// Clear cache (useful for forcing refresh)
export function clearCache() {
  settingsCache = null
  propertiesCache = null
}
