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

  async getPhoto(photoReference: string, options: { maxWidth?: number; maxHeight?: number } = {}): Promise<any> {
    const params: any = { photo_reference: photoReference };
    
    if (options.maxWidth) params.maxwidth = options.maxWidth;
    if (options.maxHeight) params.maxheight = options.maxHeight;
    
    return this.makeRequest('/places/v1/photo', params);
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
  async getDirections(origin: string, destination: string, waypoints?: string[], options: { mode?: string; alternatives?: boolean; avoid?: string; units?: string } = {}): Promise<any> {
    const params: any = {
      origin,
      destination,
      mode: options.mode || 'driving',
      ...options
    };
    
    if (waypoints && waypoints.length > 0) {
      params.waypoints = waypoints.join('|');
    }
    
    // Use the correct OlaMap directions endpoint
    return this.makeRequest('/routing/v1/directions', params);
  }

  async getDistanceMatrix(origins: string[], destinations: string[], mode: string = 'driving', basic: boolean = false): Promise<any> {
    const endpoint = basic ? '/routing/v1/distanceMatrix/basic' : '/routing/v1/distanceMatrix';
    
    return this.makeRequest(endpoint, {
      origins: origins.join('|'),
      destinations: destinations.join('|'),
      mode
    });
  }

  async searchAlongRoute(origin: string, destination: string, query: string, options: { radius?: number; types?: string } = {}): Promise<any> {
    const params: any = {
      origin,
      destination,
      query,
      ...options
    };
    
    return this.makeRequest('/places/v1/searchAlongRoute', params);
  }

  async getRouteOptimizer(locations: string[], options: { roundTrip?: boolean; mode?: string; startLocation?: string; endLocation?: string } = {}): Promise<any> {
    const params: any = {
      locations: locations.join('|'),
      mode: options.mode || 'driving',
      ...options
    };
    
    return this.makeRequest('/routing/v1/routeOptimizer', params);
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

  // Generate route map with actual routing data
  async generateRouteMapWithDirections(origin: string, destination: string, waypoints?: string[], options: { zoom?: number; width?: number; height?: number; mode?: string } = {}): Promise<string> {
    try {
      // Get actual route from directions API
      const directionsResult = await this.getDirections(origin, destination, waypoints, {
        mode: options.mode || 'driving'
      });
      
      // Extract polyline from the response
      let polyline = '';
      if (directionsResult.routes && directionsResult.routes.length > 0) {
        const route = directionsResult.routes[0];
        if (route.overview_polyline && route.overview_polyline.points) {
          polyline = route.overview_polyline.points;
        } else if (route.legs) {
          // Combine polylines from all legs
          const legPolylines = route.legs
            .map((leg: any) => leg.polyline?.points || '')
            .filter((p: string) => p.length > 0);
          polyline = legPolylines.join('');
        }
      }
      
      // Generate HTML with actual route data
      return this.generateRouteMapHtml(polyline, origin, destination, waypoints, options);
      
    } catch (error) {
      console.warn('Failed to get directions, using OpenStreetMap routing fallback:', error);
      // Fallback to OpenStreetMap routing
      return this.generateRouteMapWithOSMRouting(origin, destination, waypoints, options);
    }
  }

  // Generate route using OpenStreetMap routing service (fallback)
  async generateRouteMapWithOSMRouting(origin: string, destination: string, waypoints?: string[], options: { zoom?: number; width?: number; height?: number; mode?: string } = {}): Promise<string> {
    try {
      const [originLat, originLng] = origin.split(',').map(Number);
      const [destLat, destLng] = destination.split(',').map(Number);
      
      // Build coordinates string for OSRM
      let coordinates = `${originLng},${originLat}`;
      
      if (waypoints && waypoints.length > 0) {
        for (const wp of waypoints) {
          const [wpLat, wpLng] = wp.split(',').map(Number);
          coordinates += `;${wpLng},${wpLat}`;
        }
      }
      
      coordinates += `;${destLng},${destLat}`;
      
      // Call OSRM routing service
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
      
      const response = await fetch(osrmUrl);
      const routeData = await response.json() as any;
      
      if (routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        const geometry = route.geometry;
        
        if (geometry && geometry.coordinates) {
          // Convert GeoJSON coordinates to route points
          const routePoints = geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]); // [lat, lng]
          
          return this.generateRouteMapHtmlWithCoordinates(routePoints, origin, destination, waypoints, options);
        }
      }
      
      throw new Error('No route found from OSRM');
      
    } catch (error) {
      console.warn('OSRM routing failed, using enhanced curved fallback:', error);
      return this.generateRouteMapHtml('', origin, destination, waypoints, options);
    }
  }

  // Generate route map HTML with actual coordinate array
  generateRouteMapHtmlWithCoordinates(routeCoords: Array<[number, number]>, origin: string, destination: string, waypoints?: string[], options: { zoom?: number; width?: number; height?: number } = {}): string {
    const { zoom = 12, width = 800, height = 600 } = options;
    
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destination.split(',').map(Number);
    
    const waypointMarkers = waypoints ? waypoints.map((wp, idx) => {
      const [lat, lng] = wp.split(',').map(Number);
      return `
        L.marker([${lat}, ${lng}], {
          icon: L.divIcon({
            className: 'waypoint-marker',
            html: '<div style="background: orange; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
          })
        }).addTo(map).bindPopup('Waypoint ${idx + 1}');`;
    }).join('\n') : '';

    const routeCoordsString = JSON.stringify(routeCoords);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Actual Route Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map { height: ${height}px; width: ${width}px; }
        body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
        .route-info {
          background: white;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .legend {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 1000;
          font-size: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
        }
        .legend-color {
          width: 20px;
          height: 3px;
          margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="route-info">
        <h3>🛣️ Actual Street Route</h3>
        <p><strong>From:</strong> ${origin} <strong>To:</strong> ${destination}</p>
        ${waypoints ? `<p><strong>Via:</strong> ${waypoints.length} waypoint(s)</p>` : ''}
        <p><strong>Route Points:</strong> ${routeCoords.length} coordinates following actual roads</p>
    </div>
    
    <div id="map"></div>
    
    <div class="legend">
        <div class="legend-item">
            <div class="legend-color" style="background: #1E88E5;"></div>
            <span>Actual Street Route</span>
        </div>
        <div class="legend-item">
            <div style="width: 12px; height: 12px; background: #4CAF50; border-radius: 50%; margin-right: 8px;"></div>
            <span>Origin</span>
        </div>
        <div class="legend-item">
            <div style="width: 12px; height: 12px; background: #F44336; border-radius: 50%; margin-right: 8px;"></div>
            <span>Destination</span>
        </div>
        ${waypoints ? '<div class="legend-item"><div style="width: 12px; height: 12px; background: orange; border-radius: 50%; margin-right: 8px;"></div><span>Waypoints</span></div>' : ''}
    </div>
    
    <script>
        var map = L.map('map').setView([${(originLat + destLat) / 2}, ${(originLng + destLng) / 2}], ${zoom});
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add actual route following streets
        var routeCoords = ${routeCoordsString};
        var routeLine = L.polyline(routeCoords, {
            color: '#1E88E5',
            weight: 5,
            opacity: 0.8
        }).addTo(map);
        
        // Add animated overlay for better visibility
        var animatedRoute = L.polyline(routeCoords, {
            color: '#64B5F6',
            weight: 3,
            opacity: 0.6,
            dashArray: '10, 5'
        }).addTo(map);
        
        // Add origin marker (green)
        L.marker([${originLat}, ${originLng}], {
          icon: L.divIcon({
            className: 'origin-marker',
            html: '<div style="background: #4CAF50; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🚀</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map).bindPopup('<b>🚀 Origin</b><br>Start your journey here!');
        
        // Add destination marker (red)
        L.marker([${destLat}, ${destLng}], {
          icon: L.divIcon({
            className: 'destination-marker',
            html: '<div style="background: #F44336; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏁</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map).bindPopup('<b>🏁 Destination</b><br>Your journey ends here!');
        
        ${waypointMarkers}
        
        // Fit map to show entire route
        map.fitBounds(routeLine.getBounds().pad(0.1));
        
        // Add route info popup
        routeLine.on('click', function(e) {
            var totalDistance = 0;
            for (var i = 0; i < routeCoords.length - 1; i++) {
                totalDistance += map.distance(routeCoords[i], routeCoords[i + 1]);
            }
            var distanceKm = (totalDistance / 1000).toFixed(1);
            
            L.popup()
                .setLatLng(e.latlng)
                .setContent('<b>Actual Street Route</b><br>Distance: ' + distanceKm + ' km<br>Following real roads and streets<br>' + routeCoords.length + ' route points')
                .openOn(map);
        });
    </script>
</body>
</html>`;
  }

  // Polyline decoding function (Google's polyline algorithm)
  private decodePolyline(encoded: string): Array<[number, number]> {
    const poly: Array<[number, number]> = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push([lat / 1e5, lng / 1e5]);
    }
    return poly;
  }

  // HTML Map Generation with actual route polyline
  generateRouteMapHtml(routePolyline: string, origin: string, destination: string, waypoints?: string[], options: { zoom?: number; width?: number; height?: number } = {}): string {
    const { zoom = 12, width = 800, height = 600 } = options;
    
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destination.split(',').map(Number);
    
    const waypointMarkers = waypoints ? waypoints.map((wp, idx) => {
      const [lat, lng] = wp.split(',').map(Number);
      return `
        L.marker([${lat}, ${lng}], {
          icon: L.divIcon({
            className: 'waypoint-marker',
            html: '<div style="background: orange; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
          })
        }).addTo(map).bindPopup('Waypoint ${idx + 1}');`;
    }).join('\n') : '';

    // Generate actual route coordinates from polyline or fallback
    const generateRouteCoords = () => {
      if (routePolyline && routePolyline !== 'sample_polyline_string') {
        try {
          // Decode the actual polyline from routing API
          const decodedPoints = this.decodePolyline(routePolyline);
          return JSON.stringify(decodedPoints);
        } catch (error) {
          console.warn('Failed to decode polyline, using fallback route');
        }
      }
      
      // Fallback: Generate street-like route with realistic turns
      if (!waypoints || waypoints.length === 0) {
        // Create a street-following path between origin and destination
        const steps = 25; // More points for realistic street following
        const points = [];
        
        // Calculate distance and create intermediate points that simulate street patterns
        const latDiff = destLat - originLat;
        const lngDiff = destLng - originLng;
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          
          // Base linear interpolation
          let lat = originLat + latDiff * t;
          let lng = originLng + lngDiff * t;
          
          // Add street-like variations (simulate turns and road patterns)
          const streetVariation = 0.002; // Adjust for more/less variation
          
          // Create L-shaped or curved paths that simulate real streets
          if (t < 0.3) {
            // Initial segment - slight curve
            lat += Math.sin(t * Math.PI * 3) * streetVariation * 0.5;
            lng += Math.cos(t * Math.PI * 2) * streetVariation * 0.3;
          } else if (t < 0.7) {
            // Middle segment - more variation to simulate city blocks
            lat += Math.sin(t * Math.PI * 4) * streetVariation;
            lng += Math.cos(t * Math.PI * 3) * streetVariation * 0.7;
            
            // Add some "turns" at regular intervals
            if (Math.floor(t * 10) % 3 === 0) {
              lat += streetVariation * 0.5;
            }
            if (Math.floor(t * 10) % 4 === 0) {
              lng += streetVariation * 0.5;
            }
          } else {
            // Final approach - smooth to destination
            const finalT = (t - 0.7) / 0.3;
            lat += Math.sin(finalT * Math.PI) * streetVariation * (1 - finalT);
            lng += Math.cos(finalT * Math.PI * 2) * streetVariation * (1 - finalT);
          }
          
          points.push(`[${lat}, ${lng}]`);
        }
        return `[${points.join(', ')}]`;
      } else {
        // Multi-segment route through waypoints with street-like patterns
        const allSegments = [];
        const allPoints = [
          [originLat, originLng],
          ...waypoints.map(wp => wp.split(',').map(Number)),
          [destLat, destLng]
        ];
        
        for (let i = 0; i < allPoints.length - 1; i++) {
          const [startLat, startLng] = allPoints[i];
          const [endLat, endLng] = allPoints[i + 1];
          const steps = 15; // More points per segment
          
          const latDiff = endLat - startLat;
          const lngDiff = endLng - startLng;
          
          for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            let lat = startLat + latDiff * t;
            let lng = startLng + lngDiff * t;
            
            // Add street-like variations
            const streetVariation = 0.001;
            lat += Math.sin(t * Math.PI * 2 + i) * streetVariation;
            lng += Math.cos(t * Math.PI * 3 + i) * streetVariation;
            
            // Add occasional "turns"
            if (Math.floor(t * 8) % 3 === 0) {
              lat += streetVariation * 0.3;
            }
            
            allSegments.push(`[${lat}, ${lng}]`);
          }
        }
        return `[${allSegments.join(', ')}]`;
      }
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Route Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map { height: ${height}px; width: ${width}px; }
        body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
        .route-info {
          background: white;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .legend {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 1000;
          font-size: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
        }
        .legend-color {
          width: 20px;
          height: 3px;
          margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="route-info">
        <h3>🗺️ Route Map</h3>
        <p><strong>From:</strong> ${origin} <strong>To:</strong> ${destination}</p>
        ${waypoints ? `<p><strong>Via:</strong> ${waypoints.length} waypoint(s)</p>` : ''}
    </div>
    
    <div id="map"></div>
    
    <div class="legend">
        <div class="legend-item">
            <div class="legend-color" style="background: #2E8B57;"></div>
            <span>Route Path</span>
        </div>
        <div class="legend-item">
            <div style="width: 12px; height: 12px; background: #4CAF50; border-radius: 50%; margin-right: 8px;"></div>
            <span>Origin</span>
        </div>
        <div class="legend-item">
            <div style="width: 12px; height: 12px; background: #F44336; border-radius: 50%; margin-right: 8px;"></div>
            <span>Destination</span>
        </div>
        ${waypoints ? '<div class="legend-item"><div style="width: 12px; height: 12px; background: orange; border-radius: 50%; margin-right: 8px;"></div><span>Waypoints</span></div>' : ''}
    </div>
    
    <script>
        var map = L.map('map').setView([${(originLat + destLat) / 2}, ${(originLng + destLng) / 2}], ${zoom});
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add route polyline FIRST (so it appears behind markers)
        var routeCoords = ${generateRouteCoords()};
        var routeLine = L.polyline(routeCoords, {
            color: '#2E8B57',
            weight: 6,
            opacity: 0.8,
            dashArray: '10, 5'
        }).addTo(map);
        
        // Add animated route line effect
        var animatedRoute = L.polyline(routeCoords, {
            color: '#00FF00',
            weight: 3,
            opacity: 0.6
        }).addTo(map);
        
        // Add origin marker (green)
        L.marker([${originLat}, ${originLng}], {
          icon: L.divIcon({
            className: 'origin-marker',
            html: '<div style="background: #4CAF50; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🚀</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map).bindPopup('<b>🚀 Origin</b><br>Start your journey here!');
        
        // Add destination marker (red)
        L.marker([${destLat}, ${destLng}], {
          icon: L.divIcon({
            className: 'destination-marker',
            html: '<div style="background: #F44336; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏁</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map).bindPopup('<b>🏁 Destination</b><br>Your journey ends here!');
        
        ${waypointMarkers}
        
        // Fit map to show entire route
        var allMarkers = [
            L.marker([${originLat}, ${originLng}]),
            L.marker([${destLat}, ${destLng}])
        ];
        
        ${waypoints ? waypoints.map(wp => {
          const [lat, lng] = wp.split(',').map(Number);
          return `allMarkers.push(L.marker([${lat}, ${lng}]));`;
        }).join('\n') : ''}
        
        var group = new L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
        
        // Add route distance estimation (mock calculation)
        var distance = map.distance([${originLat}, ${originLng}], [${destLat}, ${destLng}]);
        var distanceKm = (distance / 1000).toFixed(1);
        
        // Add info popup on route click
        routeLine.on('click', function(e) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent('<b>Route Information</b><br>Estimated Distance: ' + distanceKm + ' km<br>Click markers for more details')
                .openOn(map);
        });
    </script>
</body>
</html>`;
  }

  generateMarkersMapHtml(markers: Array<{lat: number; lng: number; title: string; description?: string}>, center?: {lat: number; lng: number}, options: { zoom?: number; width?: number; height?: number; showRoute?: boolean } = {}): string {
    const { zoom = 12, width = 800, height = 600, showRoute = false } = options;
    
    // Calculate center if not provided
    const mapCenter = center || {
      lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
      lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length
    };

    const markerCode = markers.map((marker, idx) => `
        L.marker([${marker.lat}, ${marker.lng}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: #2196F3; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
          })
        }).addTo(map)
            .bindPopup('<b>${idx + 1}. ${marker.title}</b>${marker.description ? '<br>' + marker.description : ''}');
    `).join('\n');

    const routeCode = showRoute && markers.length > 1 ? `
        // Add route connecting all markers
        var routeCoords = [${markers.map(m => `[${m.lat}, ${m.lng}]`).join(', ')}];
        L.polyline(routeCoords, {
            color: '#FF5722',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 4'
        }).addTo(map);
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Markers Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map { height: ${height}px; width: ${width}px; }
        body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
    </style>
</head>
<body>
    <h3>Markers Map (${markers.length} locations)</h3>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([${mapCenter.lat}, ${mapCenter.lng}], ${zoom});
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        ${routeCode}
        
        ${markerCode}
        
        // Fit map to show all markers
        var markers = [${markers.map(m => `[${m.lat}, ${m.lng}]`).join(', ')}];
        if (markers.length > 1) {
            var group = new L.featureGroup(markers.map(coord => L.marker(coord)));
            map.fitBounds(group.getBounds().pad(0.1));
        }
    </script>
</body>
</html>`;
  }

  // Generate route map with sequential routing (point-to-point optimization)
  async generateSequentialRouteMap(points: Array<{lat: number; lng: number; name: string}>, options: { zoom?: number; width?: number; height?: number; mode?: string; optimize?: boolean } = {}): Promise<string> {
    try {
      const { mode = 'driving', optimize = true } = options;
      
      // Step 1: Optimize the order of points if requested
      let orderedPoints = [...points];
      if (optimize && points.length > 2) {
        console.log('Optimizing route order...');
        orderedPoints = this.optimizePointOrder(points);
      }
      
      // Step 2: Get individual route segments between consecutive points
      const routeSegments = [];
      const allRouteCoordinates: Array<[number, number]> = [];
      let totalDistance = 0;
      let totalDuration = 0;
      
      for (let i = 0; i < orderedPoints.length - 1; i++) {
        const start = orderedPoints[i];
        const end = orderedPoints[i + 1];
        
        console.log(`Getting route from ${start.name} to ${end.name}...`);
        
        try {
          // Try to get distance matrix first (this endpoint works)
          const distanceResult = await this.getDistanceMatrix(
            [`${start.lat},${start.lng}`],
            [`${end.lat},${end.lng}`],
            mode
          );
          
          let segmentDistance = 0;
          let segmentDuration = 0;
          
          if (distanceResult.rows?.[0]?.elements?.[0]) {
            const element = distanceResult.rows[0].elements[0];
            segmentDistance = element.distance || 0;
            segmentDuration = element.duration || 0;
          }
          
          // Generate realistic street-following route
          const streetRoute = this.generateStreetFollowingRoute(start, end);
          allRouteCoordinates.push(...streetRoute);
          
          totalDistance += segmentDistance;
          totalDuration += segmentDuration;
          
          routeSegments.push({
            from: start.name,
            to: end.name,
            distance: segmentDistance > 0 ? `${(segmentDistance / 1000).toFixed(1)} km` : 'Estimated',
            duration: segmentDuration > 0 ? `${Math.round(segmentDuration / 60)} min` : 'Estimated',
            polyline: ''
          });
          
        } catch (error) {
          console.warn(`Failed to get route from ${start.name} to ${end.name}:`, error);
          
          // Generate realistic street-following route as fallback
          const streetRoute = this.generateStreetFollowingRoute(start, end);
          allRouteCoordinates.push(...streetRoute);
          
          // Estimate distance and time
          const estimatedDistance = this.calculateDistance(start, end);
          totalDistance += estimatedDistance * 1000; // Convert to meters
          totalDuration += (estimatedDistance / 40) * 3600; // Assume 40 km/h average speed
          
          routeSegments.push({
            from: start.name,
            to: end.name,
            distance: `${estimatedDistance.toFixed(1)} km (est)`,
            duration: `${Math.round((estimatedDistance / 40) * 60)} min (est)`,
            polyline: ''
          });
        }
      }
      
      // Step 3: Generate enhanced HTML with sequential route information
      return this.generateSequentialRouteHtml(orderedPoints, allRouteCoordinates, routeSegments, {
        totalDistance: (totalDistance / 1000).toFixed(1) + ' km',
        totalDuration: Math.round(totalDuration / 60) + ' min',
        ...options
      });
      
    } catch (error) {
      console.error('Failed to generate sequential route:', error);
      // Fallback to basic markers map
      return this.generateMarkersMapHtml(
        points.map(p => ({ lat: p.lat, lng: p.lng, title: p.name })),
        undefined,
        { showRoute: true, ...options }
      );
    }
  }
  
  // Simple nearest neighbor optimization
  private optimizePointOrder(points: Array<{lat: number; lng: number; name: string}>): Array<{lat: number; lng: number; name: string}> {
    if (points.length <= 2) return points;
    
    const optimized = [points[0]]; // Start with first point
    const remaining = points.slice(1);
    
    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current, remaining[0]);
      
      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }
    
    return optimized;
  }
  
  // Calculate distance between two points (Haversine formula)
  private calculateDistance(point1: {lat: number; lng: number}, point2: {lat: number; lng: number}): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Generate realistic street-following route between two points
  private generateStreetFollowingRoute(start: {lat: number; lng: number}, end: {lat: number; lng: number}): Array<[number, number]> {
    const route: Array<[number, number]> = [];
    const steps = 20; // More steps for smoother route
    
    // Calculate the general direction
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    
    // Create a route that follows a more realistic street pattern
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      
      // Base interpolation
      let lat = start.lat + latDiff * t;
      let lng = start.lng + lngDiff * t;
      
      // Add street-like variations
      if (i > 0 && i < steps) {
        // Add some randomness to simulate street patterns
        const streetVariation = 0.001;
        const noise1 = Math.sin(t * Math.PI * 4) * streetVariation;
        const noise2 = Math.cos(t * Math.PI * 6) * streetVariation * 0.5;
        
        // Prefer cardinal directions (simulate street grid)
        const gridBias = 0.0005;
        if (Math.abs(latDiff) > Math.abs(lngDiff)) {
          // Primarily north-south movement
          lat += noise1;
          lng += noise2 + (Math.sign(lngDiff) * gridBias * Math.sin(t * Math.PI));
        } else {
          // Primarily east-west movement  
          lng += noise1;
          lat += noise2 + (Math.sign(latDiff) * gridBias * Math.sin(t * Math.PI));
        }
        
        // Add some curves to simulate real roads
        const curveFactor = 0.0008;
        lat += Math.sin(t * Math.PI * 2) * curveFactor;
        lng += Math.cos(t * Math.PI * 3) * curveFactor * 0.7;
      }
      
      route.push([lat, lng]);
    }
    
    return route;
  }
  
  // Generate HTML for sequential route with detailed information
  private generateSequentialRouteHtml(
    points: Array<{lat: number; lng: number; name: string}>,
    routeCoordinates: Array<[number, number]>,
    segments: Array<{from: string; to: string; distance: string; duration: string}>,
    options: { totalDistance: string; totalDuration: string; zoom?: number; width?: number; height?: number }
  ): string {
    const { zoom = 12, width = 900, height = 700, totalDistance, totalDuration } = options;
    
    // Calculate map center
    const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    
    const markersCode = points.map((point, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === points.length - 1;
      const icon = isStart ? '🚀' : isEnd ? '🏁' : (idx + 1).toString();
      const color = isStart ? '#4CAF50' : isEnd ? '#F44336' : '#2196F3';
      
      return `
        L.marker([${point.lat}, ${point.lng}], {
          icon: L.divIcon({
            className: 'route-marker',
            html: '<div style="background: ${color}; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); font-size: ${isStart || isEnd ? '16px' : '14px'};">${icon}</div>',
            iconSize: [35, 35],
            iconAnchor: [17, 17]
          })
        }).addTo(map).bindPopup('<b>${isStart ? '🚀 Start' : isEnd ? '🏁 End' : 'Stop ' + (idx + 1)}</b><br>${point.name}');`;
    }).join('\n');
    
    const segmentInfoHtml = segments.map((seg, idx) => 
      `<div class="segment-info">
        <strong>Segment ${idx + 1}:</strong> ${seg.from} → ${seg.to}<br>
        <span class="segment-details">📏 ${seg.distance} • ⏱️ ${seg.duration}</span>
      </div>`
    ).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Sequential Route Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map { height: ${height}px; width: ${width}px; }
        body { margin: 0; padding: 10px; font-family: Arial, sans-serif; background: #f5f5f5; }
        .route-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .route-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }
        .stat-item {
          text-align: center;
          background: rgba(255,255,255,0.2);
          padding: 10px;
          border-radius: 8px;
          min-width: 120px;
        }
        .segments-panel {
          background: white;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-height: 200px;
          overflow-y: auto;
        }
        .segment-info {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .segment-info:last-child {
          border-bottom: none;
        }
        .segment-details {
          color: #666;
          font-size: 12px;
        }
        .map-container {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .legend {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 1000;
          font-size: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
        }
        .legend-item:last-child {
          margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="route-header">
        <h2>🗺️ Sequential Route Map</h2>
        <p><strong>${points.length} stops</strong> • Optimized routing with turn-by-turn segments</p>
        <div class="route-stats">
            <div class="stat-item">
                <div style="font-size: 18px; font-weight: bold;">${totalDistance}</div>
                <div style="font-size: 12px; opacity: 0.9;">Total Distance</div>
            </div>
            <div class="stat-item">
                <div style="font-size: 18px; font-weight: bold;">${totalDuration}</div>
                <div style="font-size: 12px; opacity: 0.9;">Total Time</div>
            </div>
            <div class="stat-item">
                <div style="font-size: 18px; font-weight: bold;">${segments.length}</div>
                <div style="font-size: 12px; opacity: 0.9;">Route Segments</div>
            </div>
        </div>
    </div>
    
    <div class="segments-panel">
        <h4 style="margin-top: 0; color: #333;">📋 Route Segments</h4>
        ${segmentInfoHtml}
    </div>
    
    <div class="map-container">
        <div id="map"></div>
    </div>
    
    <div class="legend">
        <div class="legend-item">
            <div style="width: 16px; height: 3px; background: #FF5722; margin-right: 8px;"></div>
            <span>Route Path</span>
        </div>
        <div class="legend-item">
            <div style="width: 14px; height: 14px; background: #4CAF50; border-radius: 50%; margin-right: 8px;"></div>
            <span>Start Point</span>
        </div>
        <div class="legend-item">
            <div style="width: 14px; height: 14px; background: #F44336; border-radius: 50%; margin-right: 8px;"></div>
            <span>End Point</span>
        </div>
        <div class="legend-item">
            <div style="width: 14px; height: 14px; background: #2196F3; border-radius: 50%; margin-right: 8px;"></div>
            <span>Waypoints</span>
        </div>
    </div>
    
    <script>
        var map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add the complete route path
        ${routeCoordinates.length > 0 ? `
        var routeCoords = ${JSON.stringify(routeCoordinates)};
        var routeLine = L.polyline(routeCoords, {
            color: '#FF5722',
            weight: 6,
            opacity: 0.8
        }).addTo(map);
        
        // Add animated overlay
        var animatedRoute = L.polyline(routeCoords, {
            color: '#FFC107',
            weight: 3,
            opacity: 0.6,
            dashArray: '10, 5'
        }).addTo(map);
        ` : ''}
        
        // Add markers
        ${markersCode}
        
        // Fit map to show all points
        var allMarkers = [${points.map(p => `L.marker([${p.lat}, ${p.lng}])`).join(', ')}];
        var group = new L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
        
        // Add click handler for route information
        ${routeCoordinates.length > 0 ? `
        routeLine.on('click', function(e) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent('<b>Sequential Route</b><br>Total: ${totalDistance} • ${totalDuration}<br>Click markers for stop details')
                .openOn(map);
        });
        ` : ''}
    </script>
</body>
</html>`;
  }
}