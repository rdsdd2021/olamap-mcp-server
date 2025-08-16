/**
 * Map Generator for OlaMap Routes
 * 
 * Generates interactive HTML maps with proper street-level routing
 */

// Simple polyline decoder implementation
export interface LatLng {
  lat: number;
  lng: number;
}

function decodePolyline(encoded: string): LatLng[] {
  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return coordinates;
}

export interface MapOptions {
  width?: number;
  height?: number;
  zoom?: number;
  center?: LatLng;
}

export interface RouteMapOptions extends MapOptions {
  origin: string;
  destination: string;
  waypoints?: string[];
  routePolyline: string;
}

export interface MarkerInfo {
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

export function generateRouteMapHTML(options: RouteMapOptions): string {
  const {
    width = 800,
    height = 600,
    zoom = 12,
    origin,
    destination,
    waypoints = [],
    routePolyline
  } = options;

  // Decode the polyline to get actual route coordinates
  const routeCoordinates = decodePolyline(routePolyline);
  
  if (routeCoordinates.length === 0) {
    throw new Error('Invalid or empty polyline provided');
  }

  // Calculate center point from route bounds
  const bounds = calculateBounds(routeCoordinates);
  const center = {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };

  // Convert coordinates to Leaflet format
  const leafletCoordinates = routeCoordinates.map((coord: LatLng) => [coord.lat, coord.lng]);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>OlaMap Route</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        #map { 
            height: ${height}px; 
            width: ${width}px; 
        }
        .route-info {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 300px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="route-info">
        <h4>Route Information</h4>
        <p><strong>From:</strong> ${origin}</p>
        <p><strong>To:</strong> ${destination}</p>
        ${waypoints.length > 0 ? `<p><strong>Via:</strong> ${waypoints.join(', ')}</p>` : ''}
        <p><strong>Points:</strong> ${routeCoordinates.length}</p>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialize map
        var map = L.map('map').setView([${center.lat}, ${center.lng}], ${zoom});

        // Add OlaMap tiles
        L.tileLayer('https://api.olamaps.io/tiles/vector/v1/styles/default/{z}/{x}/{y}.png', {
            attribution: '© OlaMap',
            maxZoom: 19
        }).addTo(map);

        // Route coordinates
        var routeCoords = ${JSON.stringify(leafletCoordinates)};

        // Add route polyline
        var routeLine = L.polyline(routeCoords, {
            color: '#2196F3',
            weight: 5,
            opacity: 0.8
        }).addTo(map);

        // Add start marker
        var startCoord = routeCoords[0];
        L.marker(startCoord, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('<b>Start:</b> ${origin}');

        // Add end marker
        var endCoord = routeCoords[routeCoords.length - 1];
        L.marker(endCoord, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('<b>End:</b> ${destination}');

        // Fit map to route bounds
        map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
    </script>
</body>
</html>`;
}

export function generateMarkersMapHTML(markers: MarkerInfo[], options: MapOptions = {}): string {
  const {
    width = 800,
    height = 600,
    zoom = 12
  } = options;

  if (markers.length === 0) {
    throw new Error('At least one marker is required');
  }

  // Calculate center from markers
  const center = options.center || {
    lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
    lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <title>OlaMap Markers</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        #map { 
            height: ${height}px; 
            width: ${width}px; 
        }
    </style>
</head>
<body>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialize map
        var map = L.map('map').setView([${center.lat}, ${center.lng}], ${zoom});

        // Add OlaMap tiles
        L.tileLayer('https://api.olamaps.io/tiles/vector/v1/styles/default/{z}/{x}/{y}.png', {
            attribution: '© OlaMap',
            maxZoom: 19
        }).addTo(map);

        // Add markers
        var markers = ${JSON.stringify(markers)};
        var markerGroup = L.layerGroup();

        markers.forEach(function(markerInfo, index) {
            var marker = L.marker([markerInfo.lat, markerInfo.lng])
                .bindPopup('<b>' + markerInfo.title + '</b>' + 
                          (markerInfo.description ? '<br>' + markerInfo.description : ''));
            markerGroup.addLayer(marker);
        });

        markerGroup.addTo(map);

        // Fit map to markers if multiple
        if (markers.length > 1) {
            var group = new L.featureGroup(markerGroup.getLayers());
            map.fitBounds(group.getBounds().pad(0.1));
        }
    </script>
</body>
</html>`;
}

function calculateBounds(coordinates: LatLng[]) {
  let north = -90, south = 90, east = -180, west = 180;
  
  for (const coord of coordinates) {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  }
  
  return { north, south, east, west };
}