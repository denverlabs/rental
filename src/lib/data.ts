import { promises as fs } from 'fs'
import path from 'path'
import type { Property, SiteSettings } from '@/types'

const dataDir = path.join(process.cwd(), 'src', 'data')

export async function getProperties(): Promise<Property[]> {
  const filePath = path.join(dataDir, 'properties.json')
  const data = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(data)
}

export async function saveProperties(properties: Property[]): Promise<void> {
  const filePath = path.join(dataDir, 'properties.json')
  await fs.writeFile(filePath, JSON.stringify(properties, null, 2))
}

export async function getSettings(): Promise<SiteSettings> {
  const filePath = path.join(dataDir, 'settings.json')
  const data = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(data)
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  const filePath = path.join(dataDir, 'settings.json')
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2))
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
