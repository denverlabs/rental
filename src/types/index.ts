export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  priceNote?: string;
  images: string[];
  airbnbUrl: string;
  featured: boolean;
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
  footerText: string;
  adminPassword: string;
}
