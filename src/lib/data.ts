import { put, list, del } from '@vercel/blob'
import type { Property, SiteSettings } from '@/types'

// Default data (used as fallback and initial data)
import defaultSettings from '@/data/settings.json'
import defaultProperties from '@/data/properties.json'

const SETTINGS_KEY = 'settings.json'
const PROPERTIES_KEY = 'properties.json'

// Check if we're in production (Vercel)
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

// In-memory cache for development and as fallback
let settingsCache: SiteSettings | null = null
let propertiesCache: Property[] | null = null

// Helper to get blob URL
async function getBlobUrl(filename: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: filename })
    return blobs.length > 0 ? blobs[0].url : null
  } catch {
    return null
  }
}

// Helper to fetch JSON from blob
async function fetchBlobJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // Blob not found or error
  }
  return null
}

// Helper to save JSON to blob
async function saveBlobJson(filename: string, data: unknown): Promise<boolean> {
  try {
    // Delete existing blob if any
    const existingUrl = await getBlobUrl(filename)
    if (existingUrl) {
      await del(existingUrl)
    }

    // Save new blob
    await put(filename, JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false,
    })
    return true
  } catch (error) {
    console.error(`Error saving ${filename}:`, error)
    return false
  }
}

// SETTINGS
export async function getSettings(): Promise<SiteSettings> {
  // Try cache first
  if (settingsCache) {
    return settingsCache
  }

  // In production, try to get from blob
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobUrl = await getBlobUrl(SETTINGS_KEY)
      if (blobUrl) {
        const data = await fetchBlobJson<SiteSettings>(blobUrl)
        if (data) {
          settingsCache = data
          return data
        }
      }
    } catch {
      // Fall through to defaults
    }
  }

  // Return defaults
  settingsCache = defaultSettings as SiteSettings
  return settingsCache
}

export async function saveSettings(settings: SiteSettings): Promise<boolean> {
  settingsCache = settings

  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    return await saveBlobJson(SETTINGS_KEY, settings)
  }

  // In development, just update cache
  return true
}

// PROPERTIES
export async function getProperties(): Promise<Property[]> {
  // Try cache first
  if (propertiesCache) {
    return propertiesCache
  }

  // In production, try to get from blob
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobUrl = await getBlobUrl(PROPERTIES_KEY)
      if (blobUrl) {
        const data = await fetchBlobJson<Property[]>(blobUrl)
        if (data) {
          propertiesCache = data
          return data
        }
      }
    } catch {
      // Fall through to defaults
    }
  }

  // Return defaults
  propertiesCache = defaultProperties as Property[]
  return propertiesCache
}

export async function saveProperties(properties: Property[]): Promise<boolean> {
  propertiesCache = properties

  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    return await saveBlobJson(PROPERTIES_KEY, properties)
  }

  // In development, just update cache
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
