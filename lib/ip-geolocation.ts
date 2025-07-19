interface GeolocationData {
  ip: string
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
  mobile: boolean
  proxy: boolean
  hosting: boolean
}

interface EnhancedLocationData {
  ip_address: string
  country: string
  country_code: string
  region: string
  region_name: string
  city: string
  postal_code: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
  organization: string
  as_number: string
  connection_type: 'mobile' | 'residential' | 'business' | 'hosting' | 'proxy' | 'unknown' | 'development'
  is_mobile: boolean
  is_proxy: boolean
  is_hosting: boolean
  accuracy_radius: number
  location_source: 'vercel' | 'ip-api' | 'fallback' | 'localhost'
}

class IPGeolocationService {
  private static instance: IPGeolocationService
  private cache: Map<string, EnhancedLocationData> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  static getInstance(): IPGeolocationService {
    if (!IPGeolocationService.instance) {
      IPGeolocationService.instance = new IPGeolocationService()
    }
    return IPGeolocationService.instance
  }

  /**
   * Get enhanced location data for an IP address
   * Combines Vercel geo data with additional API enrichment
   */
  async getLocationData(
    ipAddress: string,
    vercelGeoData?: { country?: string; city?: string }
  ): Promise<EnhancedLocationData> {
    // Check cache first
    const cached = this.getCachedData(ipAddress)
    if (cached) {
      return cached
    }

    // Try to get enhanced data from IP-API (free tier: 1000 requests/month)
    try {
      const enhanced = await this.getEnhancedLocationData(ipAddress)
      if (enhanced) {
        this.setCachedData(ipAddress, enhanced)
        return enhanced
      }
    } catch (error) {
      console.warn('IP geolocation API failed, falling back to basic data:', error)
    }

    // Fallback to environment-aware defaults
    const isLocalhost = ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    const fallbackData: EnhancedLocationData = {
      ip_address: ipAddress,
      country: vercelGeoData?.country || (isLocalhost ? 'Local Development' : 'Geo Detection Failed'),
      country_code: vercelGeoData?.country || (isLocalhost ? 'DEV' : 'XX'),
      region: isLocalhost ? 'Local Network' : 'Region Detection Failed',
      region_name: isLocalhost ? 'Development Environment' : 'Region Detection Failed',
      city: vercelGeoData?.city || (isLocalhost ? 'localhost' : 'City Detection Failed'),
      postal_code: isLocalhost ? '' : 'Postal Code Unknown',
      latitude: 0,
      longitude: 0,
      timezone: isLocalhost ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      isp: isLocalhost ? 'Local Network' : 'ISP Detection Failed',
      organization: isLocalhost ? 'Development Machine' : 'Organization Unknown',
      as_number: isLocalhost ? 'Local AS' : 'AS Detection Failed',
      connection_type: isLocalhost ? 'development' : 'unknown',
      is_mobile: false,
      is_proxy: false,
      is_hosting: isLocalhost,
      accuracy_radius: isLocalhost ? 0 : 1000,
      location_source: isLocalhost ? 'localhost' : 'fallback'
    }

    this.setCachedData(ipAddress, fallbackData)
    return fallbackData
  }

  /**
   * Get enhanced location data from IP-API service
   */
  private async getEnhancedLocationData(ipAddress: string): Promise<EnhancedLocationData | null> {
    // Use IP-API.com (free tier, no API key required)
    // Note: For production, consider upgrading to a paid service for better reliability
    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`,
      {
        headers: {
          'User-Agent': 'berrys.ai Analytics Service'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`IP-API request failed: ${response.status}`)
    }

    const data: GeolocationData & { status: string } = await response.json()
    
    if (data.status !== 'success') {
      throw new Error(`IP-API error: ${data.status}`)
    }

    return {
      ip_address: ipAddress,
      country: data.country || 'Country Not Available',
      country_code: data.countryCode || 'XX',
      region: data.region || 'Region Not Available',
      region_name: data.regionName || 'Region Name Not Available',
      city: data.city || 'City Not Available',
      postal_code: data.zip || '',
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      timezone: data.timezone || 'UTC',
      isp: data.isp || 'ISP Not Available',
      organization: data.org || 'Organization Not Available',
      as_number: data.as || 'AS Not Available',
      connection_type: this.determineConnectionType(data),
      is_mobile: data.mobile || false,
      is_proxy: data.proxy || false,
      is_hosting: data.hosting || false,
      accuracy_radius: this.estimateAccuracy(data),
      location_source: 'ip-api'
    }
  }

  /**
   * Determine connection type based on available data
   */
  private determineConnectionType(data: GeolocationData): EnhancedLocationData['connection_type'] {
    if (data.mobile) return 'mobile'
    if (data.proxy) return 'proxy'
    if (data.hosting) return 'hosting'
    if (data.org && data.org.toLowerCase().includes('business')) return 'business'
    return 'residential'
  }

  /**
   * Estimate accuracy radius based on location data quality
   */
  private estimateAccuracy(data: GeolocationData): number {
    // More specific data = better accuracy
    if (data.city && data.zip) return 5 // ~5km for city + postal
    if (data.city) return 25 // ~25km for city only
    if (data.regionName) return 100 // ~100km for region
    return 1000 // ~1000km for country only
  }

  /**
   * Cache management
   */
  private getCachedData(ipAddress: string): EnhancedLocationData | null {
    const now = Date.now()
    const expiry = this.cacheExpiry.get(ipAddress)
    
    if (expiry && now > expiry) {
      this.cache.delete(ipAddress)
      this.cacheExpiry.delete(ipAddress)
      return null
    }

    return this.cache.get(ipAddress) || null
  }

  private setCachedData(ipAddress: string, data: EnhancedLocationData): void {
    this.cache.set(ipAddress, data)
    this.cacheExpiry.set(ipAddress, Date.now() + this.CACHE_DURATION)
  }

  /**
   * Format location for display
   */
  formatLocation(data: EnhancedLocationData): string {
    const parts = []
    
    if (data.city && data.city !== 'City Not Available' && data.city !== 'City Detection Failed') parts.push(data.city)
    if (data.region_name && data.region_name !== 'Region Name Not Available' && data.region_name !== 'Region Detection Failed') parts.push(data.region_name)
    if (data.country && data.country !== 'Country Not Available' && data.country !== 'Geo Detection Failed') parts.push(data.country)
    
    return parts.join(', ') || 'Location Not Available'
  }

  /**
   * Get location summary for dashboard
   */
  getLocationSummary(data: EnhancedLocationData): {
    display: string
    details: string
    coordinates: string
    connection: string
  } {
    return {
      display: this.formatLocation(data),
      details: `${data.timezone} • ${data.isp}`,
      coordinates: data.latitude && data.longitude 
        ? `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`
        : 'Coordinates unavailable',
      connection: `${data.connection_type} ${data.is_mobile ? '(Mobile)' : ''}${data.is_proxy ? '(Proxy)' : ''}`.trim()
    }
  }

  /**
   * Bulk process locations for dashboard
   */
  async processSessionLocations(sessions: any[]): Promise<any[]> {
    const enhancedSessions = await Promise.all(
      sessions.map(async (session) => {
        if (!session.ip_address) return session

        const locationData = await this.getLocationData(
          session.ip_address,
          { country: session.country, city: session.city }
        )

        return {
          ...session,
          enhanced_location: locationData,
          location_summary: this.getLocationSummary(locationData)
        }
      })
    )

    return enhancedSessions
  }
}

// Export singleton instance
export const ipGeolocationService = IPGeolocationService.getInstance()
export type { EnhancedLocationData } 