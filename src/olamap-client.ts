/**
 * OlaMap API Client
 * 
 * A comprehensive client for interacting with OlaMap APIs
 */

import fetch from 'node-fetch';

export interface OlaMapClientOptions {
  baseUrl?: string;
  timeout?: number;
}

export class OlaMapClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(apiKey: string, options: OlaMapClientOptions = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.olamaps.io';
    this.timeout = options.timeout || 30000; // 30 seconds
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}, method: 'GET' | 'POST' = 'GET'): Promise<any> {
    const url = new URL(endpoint, this.baseUrl);
    url.searchParams.append('api_key', this.apiKey);

    const requestOptions: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OlaMap-MCP-Server/1.0'
      },
      timeout: this.timeout
    };

    if (method === 'GET') {
      // Add parameters to URL for GET requests
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    } else {
      // Add body for POST requests
      if (Object.keys(params).length > 0) {
        requestOptions.body = JSON.stringify(params);
      }
    }

    try {
      const response = await fetch(url.toString(), requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OlaMap API request failed: ${error.message}`);
      }
      throw new Error('OlaMap API request failed: Unknown error');
    }
  }

  // Places APIs
  async autocomplete(input: string, location?: string, options: { radius?: string; types?: string } = {}): Promise<any> {
    const params: any = { input, ...options };
    if (location) params.location = location;
    
    return this.makeRequest('/places/v1/autocomplete', params);
  }

  async getPlaceDetails(placeId: string, advanced: boolean = false): Promise<any> {
    const endpoint = advanced ? '/places/v1/details/advanced' : '/places/v1/details';
    return this.makeRequest(endpoint, { place_id: placeId });
  }

  async nearbySearch(location: string, options: { radius?: string; types?: string; limit?: string; advanced?: boolean } = {}): Promise<any> {
    const { advanced, ...params } = options;
    const endpoint = advanced ? '/places/v1/nearbysearch/advanced' : '/places/v1/nearbysearch';
    
    return this.makeRequest(endpoint, { location, ...params });
  }

  async textSearch(input: string, location?: string, radius?: string): Promise<any> {
    const params: any = { input };
    if (location) params.location = location;
    if (radius) params.radius = radius;
    
    return this.makeRequest('/places/v1/textsearch', params);
  }

  async validateAddress(address: string): Promise<any> {
    return this.makeRequest('/places/v1/addressvalidation', { address });
  }

  // Geocoding APIs
  async geocode(address: string, bounds?: string): Promise<any> {
    const params: any = { address };
    if (bounds) params.bounds = bounds;
    
    return this.makeRequest('/places/v1/geocode', params);
  }

  async reverseGeocode(lat: number, lng: number, resultType?: string): Promise<any> {
    const params: any = { latlng: `${lat},${lng}` };
    if (resultType) params.result_type = resultType;
    
    return this.makeRequest('/places/v1/reverse-geocode', params);
  }

  // Routing APIs
  async getDistanceMatrix(origins: string[], destinations: string[], mode: string = 'driving', basic: boolean = false): Promise<any> {
    const endpoint = basic ? '/routing/v1/distanceMatrix/basic' : '/routing/v1/distanceMatrix';
    
    return this.makeRequest(endpoint, {
      origins: origins.join('|'),
      destinations: destinations.join('|'),
      mode
    });
  }

  // Roads APIs
  async snapToRoad(points: string[], options: { enhancePath?: boolean; interpolate?: boolean } = {}): Promise<any> {
    const params: any = { points: points.join('|') };
    if (options.enhancePath !== undefined) params.enhancePath = options.enhancePath.toString();
    if (options.interpolate !== undefined) params.interpolate = options.interpolate.toString();
    
    return this.makeRequest('/routing/v1/snapToRoad', params);
  }

  async getNearestRoads(points: string[], mode: string = 'DRIVING', radius: number = 500): Promise<any> {
    return this.makeRequest('/routing/v1/nearestRoads', {
      points: points.join('|'),
      mode,
      radius: radius.toString()
    });
  }

  async getSpeedLimits(points: string[], snapStrategy: string = 'snaptoroad'): Promise<any> {
    return this.makeRequest('/routing/v1/speedLimits', {
      points: points.join('|'),
      snapStrategy
    });
  }

  // Elevation APIs
  async getElevation(lat: number, lng: number): Promise<any> {
    return this.makeRequest('/places/v1/elevation', {
      location: `${lat},${lng}`
    });
  }

  async getMultipleElevations(coordinates: string[]): Promise<any> {
    return this.makeRequest('/places/v1/elevation', {
      locations: coordinates
    }, 'POST');
  }

  // Tiles APIs
  async getMapStyles(): Promise<any> {
    return this.makeRequest('/tiles/vector/v1/styles.json');
  }

  async getStyleConfig(styleName: string): Promise<any> {
    return this.makeRequest(`/tiles/vector/v1/styles/${styleName}/style.json`);
  }

  async get3DTilesetConfig(): Promise<any> {
    return this.makeRequest('/tiles/vector/v1/3dtiles/tileset.json');
  }
}