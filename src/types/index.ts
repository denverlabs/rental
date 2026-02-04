export interface Property {
  id: string;
  referenceCode?: string; // Número de ficha manual (ej: "PDE-001")
  title: string;
  description: string;
  location: string;
  price: string;
  priceNote?: string;
  images: string[];
  airbnbUrl: string;
  featured: boolean;
  active: boolean;
  amenities: string[];
  guests: number;
  bedrooms: number;
  bathrooms: number;
}

export interface SiteSettings {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  whatsappNumber: string;
  whatsappMessage: string;
  email: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  footerText: string;
  adminPassword: string;
  // Analytics & Tracking
  googleAnalyticsId?: string;    // GA4: G-XXXXXXXXXX
  metaPixelId?: string;          // Facebook Pixel: 123456789
  googleTagManagerId?: string;   // GTM: GTM-XXXXXXX
  customHeadCode?: string;       // Código personalizado para <head>
}

// CRM Types
export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type ReservationSource = 'whatsapp' | 'airbnb' | 'direct' | 'other';

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone: string;           // WhatsApp number
  country?: string;
  notes?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  propertyId: string;      // Links to Property.id
  propertyCode: string;    // Links to Property.referenceCode (ej: "PDE-001")
  guestId: string;         // Links to Guest.id

  // Dates
  checkIn: string;         // ISO date: "2026-01-15"
  checkOut: string;        // ISO date: "2026-01-20"

  // Status
  status: ReservationStatus;
  source: ReservationSource;

  // Pricing
  totalAmount: number;
  currency: string;        // "USD" | "UYU"
  paidAmount: number;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
