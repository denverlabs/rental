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
