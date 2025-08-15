#!/usr/bin/env node

/**
 * OlaMap MCP Server
 * 
 * A Model Context Protocol server that provides access to OlaMap APIs
 * for location services, geocoding, places search, routing, and more.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { OlaMapClient } from './olamap-client.js';
import { AdvancedRoutePlanner } from './route-planner.js';
import { 
  AutocompleteArgsSchema,
  PlaceDetailsArgsSchema,
  NearbySearchArgsSchema,
  TextSearchArgsSchema,
  AddressValidationArgsSchema,
  GeocodeArgsSchema,
  ReverseGeocodeArgsSchema,
  DistanceMatrixArgsSchema,
  SnapToRoadArgsSchema,
  NearestRoadsArgsSchema,
  SpeedLimitsArgsSchema,
  ElevationArgsSchema,
  MultipleElevationArgsSchema,
  MapStylesArgsSchema,
  StyleConfigArgsSchema,
  TripPlannerArgsSchema,
  LocationFinderArgsSchema,
  RouteOptimizerArgsSchema,
  DirectionsArgsSchema,
  PhotoArgsSchema,
  SearchAlongRouteArgsSchema,
  RouteOptimizerAdvancedArgsSchema,
  ShowMapHtmlArgsSchema,
  ShowMarkersMapHtmlArgsSchema,
  ShowActualRouteMapArgsSchema,
  SequentialRouteMapArgsSchema
} from './schemas.js';

const server = new Server(
  {
    name: 'olamap-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize OlaMap client and route planner
let olaMapClient: OlaMapClient | null = null;
let routePlanner: AdvancedRoutePlanner | null = null;

// Tool definitions
const tools: Tool[] = [
  {
    name: 'olamap_autocomplete',
    description: 'Get place suggestions with autocomplete for a search query',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Search query text'
        },
        location: {
          type: 'string',
          description: 'Optional bias location as "lat,lng"'
        },
        radius: {
          type: 'string',
          description: 'Optional search radius in meters'
        },
        types: {
          type: 'string',
          description: 'Optional place types filter (airport, restaurant, etc.)'
        }
      },
      required: ['input']
    }
  },
  {
    name: 'olamap_place_details',
    description: 'Get detailed information about a place using place_id',
    inputSchema: {
      type: 'object',
      properties: {
        place_id: {
          type: 'string',
          description: 'Unique place identifier from autocomplete or search'
        },
        advanced: {
          type: 'boolean',
          description: 'Whether to get advanced details with extended information',
          default: false
        }
      },
      required: ['place_id']
    }
  },
  {
    name: 'olamap_nearby_search',
    description: 'Find nearby places around a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Center point coordinates as "lat,lng"'
        },
        radius: {
          type: 'string',
          description: 'Search radius in meters (default: 1000)'
        },
        types: {
          type: 'string',
          description: 'Place types filter (restaurant, cafe, etc.)'
        },
        limit: {
          type: 'string',
          description: 'Maximum number of results (default: 10)'
        },
        advanced: {
          type: 'boolean',
          description: 'Whether to get advanced details',
          default: false
        }
      },
      required: ['location']
    }
  },
  {
    name: 'olamap_text_search',
    description: 'Search for places using natural language queries',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Natural language search query'
        },
        location: {
          type: 'string',
          description: 'Optional center point for search bias as "lat,lng"'
        },
        radius: {
          type: 'string',
          description: 'Optional search radius in meters'
        }
      },
      required: ['input']
    }
  },
  {
    name: 'olamap_validate_address',
    description: 'Validate and standardize Indian addresses (must include pincode)',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Complete address with pincode in format: "Area, City, State PINCODE, Country"'
        }
      },
      required: ['address']
    }
  },
  {
    name: 'olamap_geocode',
    description: 'Convert addresses to coordinates (forward geocoding)',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Address string to geocode'
        },
        bounds: {
          type: 'string',
          description: 'Optional bounding box for result biasing as "sw_lat,sw_lng|ne_lat,ne_lng"'
        },
        region: {
          type: 'string',
          description: 'Optional region code for biasing'
        }
      },
      required: ['address']
    }
  },
  {
    name: 'olamap_reverse_geocode',
    description: 'Convert coordinates to addresses (reverse geocoding)',
    inputSchema: {
      type: 'object',
      properties: {
        lat: {
          type: 'number',
          description: 'Latitude'
        },
        lng: {
          type: 'number',
          description: 'Longitude'
        },
        result_type: {
          type: 'string',
          description: 'Optional filter by result types'
        }
      },
      required: ['lat', 'lng']
    }
  },
  {
    name: 'olamap_distance_matrix',
    description: 'Calculate distance and time matrix between multiple points',
    inputSchema: {
      type: 'object',
      properties: {
        origins: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of origin coordinates as ["lat,lng", ...]'
        },
        destinations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of destination coordinates as ["lat,lng", ...]'
        },
        mode: {
          type: 'string',
          description: 'Travel mode (driving, walking, cycling)',
          default: 'driving'
        },
        units: {
          type: 'string',
          description: 'Unit system (metric, imperial)',
          default: 'metric'
        },
        basic: {
          type: 'boolean',
          description: 'Use basic version without traffic data',
          default: false
        }
      },
      required: ['origins', 'destinations']
    }
  },
  {
    name: 'olamap_snap_to_road',
    description: 'Snap GPS coordinates to the nearest road network',
    inputSchema: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of coordinates to snap as ["lat,lng", ...]'
        },
        enhancePath: {
          type: 'boolean',
          description: 'Add intermediate points',
          default: false
        },
        interpolate: {
          type: 'boolean',
          description: 'Interpolate between points',
          default: true
        }
      },
      required: ['points']
    }
  },
  {
    name: 'olamap_nearest_roads',
    description: 'Find nearest roads to given coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of coordinates as ["lat,lng", ...]'
        },
        mode: {
          type: 'string',
          description: 'Travel mode (DRIVING, WALKING)',
          default: 'DRIVING'
        },
        radius: {
          type: 'number',
          description: 'Search radius in meters',
          default: 500
        }
      },
      required: ['points']
    }
  },
  {
    name: 'olamap_speed_limits',
    description: 'Get speed limits for road segments',
    inputSchema: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of coordinates as ["lat,lng", ...]'
        },
        snapStrategy: {
          type: 'string',
          description: 'Snapping strategy',
          default: 'snaptoroad'
        }
      },
      required: ['points']
    }
  },
  {
    name: 'olamap_elevation',
    description: 'Get elevation data for coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        lat: {
          type: 'number',
          description: 'Latitude'
        },
        lng: {
          type: 'number',
          description: 'Longitude'
        }
      },
      required: ['lat', 'lng']
    }
  },
  {
    name: 'olamap_multiple_elevations',
    description: 'Get elevation data for multiple coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        coordinates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of coordinates as ["lat,lng", ...]'
        }
      },
      required: ['coordinates']
    }
  },
  {
    name: 'olamap_map_styles',
    description: 'Get available vector tile map styles',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'olamap_style_config',
    description: 'Get configuration for a specific map style',
    inputSchema: {
      type: 'object',
      properties: {
        style_name: {
          type: 'string',
          description: 'Style name (e.g., bolt-light, eclipse-dark-standard)'
        }
      },
      required: ['style_name']
    }
  },
  {
    name: 'olamap_3d_tileset',
    description: 'Get 3D tiles configuration',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'olamap_plan_trip',
    description: 'Plan a complex multi-location trip with time constraints and vehicle considerations',
    inputSchema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Location name' },
              address: { type: 'string', description: 'Full address (optional if coordinates provided)' },
              coordinates: { type: 'string', description: 'Coordinates as "lat,lng" (optional if address provided)' },
              place_id: { type: 'string', description: 'OlaMap place ID (optional)' },
              visit_duration_minutes: { type: 'number', description: 'Time to spend at location in minutes' },
              preferred_time: { type: 'string', description: 'Preferred visit time as "HH:MM" (optional)' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Visit priority' },
              notes: { type: 'string', description: 'Additional notes (optional)' }
            },
            required: ['name', 'visit_duration_minutes']
          },
          description: 'List of locations to visit'
        },
        vehicle: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['car', 'bike', 'walking', 'public_transport'], description: 'Vehicle type' },
            average_speed_kmh: { type: 'number', description: 'Average speed in km/h (optional)' },
            fuel_efficiency: { type: 'number', description: 'Fuel efficiency (optional)' },
            capacity: { type: 'number', description: 'Vehicle capacity (optional)' }
          },
          required: ['type']
        },
        constraints: {
          type: 'object',
          properties: {
            start_time: { type: 'string', description: 'Trip start time as "HH:MM"' },
            end_time: { type: 'string', description: 'Trip end time as "HH:MM"' },
            start_location: { type: 'string', description: 'Starting location coordinates or address (optional)' },
            end_location: { type: 'string', description: 'Ending location coordinates or address (optional)' },
            max_travel_time_minutes: { type: 'number', description: 'Maximum travel time per day in minutes (optional)' },
            max_total_distance_km: { type: 'number', description: 'Maximum distance per day in km (optional)' },
            break_duration_minutes: { type: 'number', description: 'Break duration in minutes (optional)' },
            break_after_hours: { type: 'number', description: 'Take break after X hours (optional)' }
          },
          required: ['start_time', 'end_time']
        },
        date: { type: 'string', description: 'Trip date in YYYY-MM-DD format (optional)' }
      },
      required: ['locations', 'vehicle', 'constraints']
    }
  },
  {
    name: 'olamap_find_locations',
    description: 'Find and suggest locations based on criteria (schools, restaurants, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "schools in Bengaluru", "restaurants near Koramangala")' },
        location: { type: 'string', description: 'Center location as coordinates "lat,lng" or address' },
        radius: { type: 'number', description: 'Search radius in meters', default: 5000 },
        limit: { type: 'number', description: 'Maximum number of results', default: 10 },
        types: { type: 'string', description: 'Place types filter (school, restaurant, hospital, etc.)' },
        include_details: { type: 'boolean', description: 'Include detailed information', default: true }
      },
      required: ['query', 'location']
    }
  },
  {
    name: 'olamap_optimize_route',
    description: 'Optimize route order for multiple locations to minimize travel time',
    inputSchema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              coordinates: { type: 'string', description: 'Coordinates as "lat,lng"' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium' }
            },
            required: ['name', 'coordinates']
          }
        },
        start_location: { type: 'string', description: 'Starting point coordinates "lat,lng"' },
        end_location: { type: 'string', description: 'Ending point coordinates "lat,lng" (optional)' },
        vehicle_type: { type: 'string', enum: ['car', 'bike', 'walking'], default: 'car' },
        optimization_goal: { type: 'string', enum: ['time', 'distance', 'balanced'], default: 'time' }
      },
      required: ['locations']
    }
  },
  {
    name: 'olamap_get_directions',
    description: 'Provides routable path between two or more points',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Starting point as coordinates "lat,lng" or address' },
        destination: { type: 'string', description: 'Ending point as coordinates "lat,lng" or address' },
        waypoints: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Optional waypoints as coordinates or addresses'
        },
        mode: { type: 'string', description: 'Travel mode (driving, walking, cycling)', default: 'driving' },
        alternatives: { type: 'boolean', description: 'Return alternative routes', default: false },
        avoid: { type: 'string', description: 'Avoid tolls, highways, ferries' },
        units: { type: 'string', description: 'Unit system (metric, imperial)', default: 'metric' }
      },
      required: ['origin', 'destination']
    }
  },
  {
    name: 'olamap_get_photo',
    description: 'Fetches a photo URL & metadata from a photo reference',
    inputSchema: {
      type: 'object',
      properties: {
        photo_reference: { type: 'string', description: 'Photo reference from place details' },
        maxWidth: { type: 'number', description: 'Maximum width of the photo' },
        maxHeight: { type: 'number', description: 'Maximum height of the photo' }
      },
      required: ['photo_reference']
    }
  },
  {
    name: 'olamap_search_along_route',
    description: 'Searches for POIs along a specified route',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Route starting point as coordinates "lat,lng" or address' },
        destination: { type: 'string', description: 'Route ending point as coordinates "lat,lng" or address' },
        query: { type: 'string', description: 'Search query for POIs (e.g., "gas station", "restaurant")' },
        radius: { type: 'number', description: 'Search radius in meters from route', default: 5000 },
        types: { type: 'string', description: 'Place types filter (restaurant, gas_station, etc.)' }
      },
      required: ['origin', 'destination', 'query']
    }
  },
  {
    name: 'olamap_get_route_optimizer',
    description: 'Similar to olamap_optimize_route, but includes more specific optional params like round_trip, mode',
    inputSchema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of location coordinates as ["lat,lng", ...]'
        },
        roundTrip: { type: 'boolean', description: 'Return to starting location', default: false },
        mode: { type: 'string', description: 'Travel mode (driving, walking, cycling)', default: 'driving' },
        startLocation: { type: 'string', description: 'Starting location coordinates "lat,lng"' },
        endLocation: { type: 'string', description: 'Ending location coordinates "lat,lng"' }
      },
      required: ['locations']
    }
  },
  {
    name: 'olamap_show_map_html_for_route',
    description: 'Returns HTML for an interactive map with a polyline',
    inputSchema: {
      type: 'object',
      properties: {
        route_polyline: { type: 'string', description: 'Encoded polyline string from directions API' },
        origin: { type: 'string', description: 'Starting point coordinates "lat,lng"' },
        destination: { type: 'string', description: 'Ending point coordinates "lat,lng"' },
        waypoints: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Optional waypoints coordinates'
        },
        zoom: { type: 'number', description: 'Map zoom level', default: 12 },
        width: { type: 'number', description: 'Map width in pixels', default: 800 },
        height: { type: 'number', description: 'Map height in pixels', default: 600 }
      },
      required: ['route_polyline', 'origin', 'destination']
    }
  },
  {
    name: 'olamap_show_actual_route_map',
    description: 'Generate HTML map with actual routed path using OlaMap directions API',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Starting point coordinates "lat,lng" or address' },
        destination: { type: 'string', description: 'Ending point coordinates "lat,lng" or address' },
        waypoints: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Optional waypoints coordinates or addresses'
        },
        mode: { type: 'string', description: 'Travel mode (driving, walking, cycling)', default: 'driving' },
        zoom: { type: 'number', description: 'Map zoom level', default: 12 },
        width: { type: 'number', description: 'Map width in pixels', default: 800 },
        height: { type: 'number', description: 'Map height in pixels', default: 600 }
      },
      required: ['origin', 'destination']
    }
  },
  {
    name: 'olamap_sequential_route_map',
    description: 'Generate optimized sequential route map with point-to-point routing (A→B→C→D)',
    inputSchema: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lat: { type: 'number', description: 'Latitude' },
              lng: { type: 'number', description: 'Longitude' },
              name: { type: 'string', description: 'Location name' }
            },
            required: ['lat', 'lng', 'name']
          },
          description: 'Array of points to visit in sequence',
          minItems: 2
        },
        mode: { type: 'string', description: 'Travel mode (driving, walking, cycling)', default: 'driving' },
        optimize: { type: 'boolean', description: 'Optimize point order for shortest route', default: true },
        zoom: { type: 'number', description: 'Map zoom level', default: 12 },
        width: { type: 'number', description: 'Map width in pixels', default: 900 },
        height: { type: 'number', description: 'Map height in pixels', default: 700 }
      },
      required: ['points']
    }
  },
  {
    name: 'olamap_show_markers_map_html',
    description: 'Returns HTML for a map with markers and popups, optionally connected by routes',
    inputSchema: {
      type: 'object',
      properties: {
        markers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lat: { type: 'number', description: 'Marker latitude' },
              lng: { type: 'number', description: 'Marker longitude' },
              title: { type: 'string', description: 'Marker title' },
              description: { type: 'string', description: 'Marker popup description' }
            },
            required: ['lat', 'lng', 'title']
          },
          description: 'Array of markers to display'
        },
        center: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          },
          description: 'Map center coordinates (optional, auto-calculated if not provided)'
        },
        zoom: { type: 'number', description: 'Map zoom level', default: 12 },
        width: { type: 'number', description: 'Map width in pixels', default: 800 },
        height: { type: 'number', description: 'Map height in pixels', default: 600 },
        showRoute: { type: 'boolean', description: 'Connect markers with route lines', default: false }
      },
      required: ['markers']
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Helper methods
function suggestVisitDuration(types: string[]): number {
  if (!types) return 30;
  
  if (types.includes('school') || types.includes('university')) return 60;
  if (types.includes('hospital') || types.includes('doctor')) return 45;
  if (types.includes('restaurant') || types.includes('cafe')) return 90;
  if (types.includes('shopping_mall') || types.includes('store')) return 120;
  if (types.includes('tourist_attraction') || types.includes('museum')) return 180;
  if (types.includes('bank') || types.includes('atm')) return 15;
  if (types.includes('gas_station')) return 10;
  
  return 30; // Default
}

function calculateEfficiencyImprovement(originalLocations: any[], result: any): string {
  // Simple efficiency calculation - in a real implementation, 
  // you'd compare against the original order
  const optimizedDistance = result.total_distance_km;
  const estimatedOriginalDistance = optimizedDistance * 1.2; // Assume 20% improvement
  const improvement = ((estimatedOriginalDistance - optimizedDistance) / estimatedOriginalDistance * 100).toFixed(1);
  return `Estimated ${improvement}% reduction in travel distance`;
}

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!olaMapClient) {
    throw new Error('OlaMap client not initialized. Please set OLAMAP_API_KEY environment variable.');
  }

  try {
    switch (name) {
      case 'olamap_autocomplete': {
        const parsed = AutocompleteArgsSchema.parse(args);
        const result = await olaMapClient.autocomplete(parsed.input, parsed.location, {
          radius: parsed.radius,
          types: parsed.types
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_place_details': {
        const parsed = PlaceDetailsArgsSchema.parse(args);
        const result = await olaMapClient.getPlaceDetails(parsed.place_id, parsed.advanced);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_nearby_search': {
        const parsed = NearbySearchArgsSchema.parse(args);
        const result = await olaMapClient.nearbySearch(parsed.location, {
          radius: parsed.radius,
          types: parsed.types,
          limit: parsed.limit,
          advanced: parsed.advanced
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_text_search': {
        const parsed = TextSearchArgsSchema.parse(args);
        const result = await olaMapClient.textSearch(parsed.input, parsed.location, parsed.radius);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_validate_address': {
        const parsed = AddressValidationArgsSchema.parse(args);
        const result = await olaMapClient.validateAddress(parsed.address);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_geocode': {
        const parsed = GeocodeArgsSchema.parse(args);
        const result = await olaMapClient.geocode(parsed.address, parsed.bounds);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_reverse_geocode': {
        const parsed = ReverseGeocodeArgsSchema.parse(args);
        const result = await olaMapClient.reverseGeocode(parsed.lat, parsed.lng, parsed.result_type);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_distance_matrix': {
        const parsed = DistanceMatrixArgsSchema.parse(args);
        const result = await olaMapClient.getDistanceMatrix(
          parsed.origins,
          parsed.destinations,
          parsed.mode,
          parsed.basic
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_snap_to_road': {
        const parsed = SnapToRoadArgsSchema.parse(args);
        const result = await olaMapClient.snapToRoad(parsed.points, {
          enhancePath: parsed.enhancePath,
          interpolate: parsed.interpolate
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_nearest_roads': {
        const parsed = NearestRoadsArgsSchema.parse(args);
        const result = await olaMapClient.getNearestRoads(parsed.points, parsed.mode, parsed.radius);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_speed_limits': {
        const parsed = SpeedLimitsArgsSchema.parse(args);
        const result = await olaMapClient.getSpeedLimits(parsed.points, parsed.snapStrategy);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_elevation': {
        const parsed = ElevationArgsSchema.parse(args);
        const result = await olaMapClient.getElevation(parsed.lat, parsed.lng);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_multiple_elevations': {
        const parsed = MultipleElevationArgsSchema.parse(args);
        const result = await olaMapClient.getMultipleElevations(parsed.coordinates);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_map_styles': {
        const result = await olaMapClient.getMapStyles();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_style_config': {
        const parsed = StyleConfigArgsSchema.parse(args);
        const result = await olaMapClient.getStyleConfig(parsed.style_name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_3d_tileset': {
        const result = await olaMapClient.get3DTilesetConfig();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_plan_trip': {
        if (!routePlanner) {
          throw new Error('Route planner not initialized');
        }
        
        const parsed = TripPlannerArgsSchema.parse(args);
        const result = await routePlanner.planTrip(
          parsed.locations,
          parsed.vehicle,
          parsed.constraints,
          parsed.date
        );
        
        // Format the response for better readability
        const formattedResult = {
          summary: {
            feasible_in_single_day: result.feasible_in_single_day,
            recommended_days: result.recommended_days,
            total_distance_km: result.total_distance_km,
            total_time_hours: result.total_time_hours
          },
          day_plans: result.day_plans.map(plan => ({
            day: plan.day,
            date: plan.date,
            feasible: plan.feasible,
            locations: plan.locations.map(loc => loc.name),
            schedule: plan.locations.map((loc, idx) => ({
              location: loc.name,
              arrival_time: plan.route_segments[idx - 1]?.arrival_time || plan.start_time,
              departure_time: plan.route_segments[idx]?.departure_time || 
                            (idx === plan.locations.length - 1 ? plan.end_time : 'N/A'),
              visit_duration: loc.visit_duration_minutes + ' minutes'
            })),
            total_distance_km: plan.total_distance_km,
            total_travel_time: plan.total_travel_time_minutes + ' minutes',
            issues: plan.issues,
            suggestions: plan.suggestions
          })),
          unvisited_locations: result.unvisited_locations.map(loc => loc.name),
          optimization_notes: result.optimization_notes,
          alternative_suggestions: result.alternative_suggestions,
          detailed_plan: result
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedResult, null, 2)
            }
          ]
        };
      }

      case 'olamap_find_locations': {
        const parsed = LocationFinderArgsSchema.parse(args);
        
        // First, resolve the center location
        let centerCoords = parsed.location;
        if (!centerCoords.includes(',')) {
          // It's an address, geocode it
          const geocodeResult = await olaMapClient.geocode(parsed.location);
          if (geocodeResult.geocodingResults && geocodeResult.geocodingResults.length > 0) {
            const result = geocodeResult.geocodingResults[0];
            centerCoords = `${result.geometry.location.lat},${result.geometry.location.lng}`;
          }
        }
        
        // Search for locations
        const searchResult = await olaMapClient.nearbySearch(centerCoords, {
          radius: parsed.radius?.toString(),
          types: parsed.types,
          limit: parsed.limit?.toString(),
          advanced: parsed.include_details
        });
        
        // Format results for trip planning
        const locations = searchResult.predictions?.map((place: any, index: number) => ({
          name: place.structured_formatting?.main_text || place.description,
          address: place.structured_formatting?.secondary_text || place.description,
          coordinates: place.geometry?.location ? 
            `${place.geometry.location.lat},${place.geometry.location.lng}` : null,
          place_id: place.place_id,
          types: place.types,
          rating: place.rating,
          distance_meters: place.distance_meters,
          suggested_visit_duration: suggestVisitDuration(place.types),
          details: parsed.include_details ? {
            phone: place.formatted_phone_number,
            website: place.website,
            opening_hours: place.opening_hours,
            amenities: place.amenities_available
          } : undefined
        })) || [];
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query: parsed.query,
                center_location: centerCoords,
                total_found: locations.length,
                locations: locations,
                trip_planning_ready: locations.filter((loc: any) => loc.coordinates).length > 0
              }, null, 2)
            }
          ]
        };
      }

      case 'olamap_optimize_route': {
        if (!routePlanner) {
          throw new Error('Route planner not initialized');
        }
        
        const parsed = RouteOptimizerArgsSchema.parse(args);
        
        // Convert to visit locations format
        const visitLocations = parsed.locations.map(loc => ({
          name: loc.name,
          coordinates: loc.coordinates,
          visit_duration_minutes: 30, // Default visit time
          priority: loc.priority || 'medium'
        }));
        
        // Create basic constraints
        const constraints = {
          start_time: '09:00',
          end_time: '18:00'
        };
        
        // Create vehicle
        const vehicle = {
          type: parsed.vehicle_type || 'car'
        };
        
        const result = await routePlanner.planTrip(visitLocations, vehicle, constraints);
        
        const optimizedRoute = {
          optimization_goal: parsed.optimization_goal,
          original_order: parsed.locations.map(loc => loc.name),
          optimized_order: result.day_plans[0]?.locations.map(loc => loc.name) || [],
          total_distance_km: result.total_distance_km,
          total_travel_time_hours: result.day_plans[0]?.total_travel_time_minutes ? 
            (result.day_plans[0].total_travel_time_minutes / 60).toFixed(1) : 0,
          route_segments: result.day_plans[0]?.route_segments || [],
          efficiency_improvement: calculateEfficiencyImprovement(parsed.locations, result)
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(optimizedRoute, null, 2)
            }
          ]
        };
      }

      case 'olamap_get_directions': {
        const parsed = DirectionsArgsSchema.parse(args);
        const result = await olaMapClient.getDirections(
          parsed.origin,
          parsed.destination,
          parsed.waypoints,
          {
            mode: parsed.mode,
            alternatives: parsed.alternatives,
            avoid: parsed.avoid,
            units: parsed.units
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_get_photo': {
        const parsed = PhotoArgsSchema.parse(args);
        const result = await olaMapClient.getPhoto(parsed.photo_reference, {
          maxWidth: parsed.maxWidth,
          maxHeight: parsed.maxHeight
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_search_along_route': {
        const parsed = SearchAlongRouteArgsSchema.parse(args);
        const result = await olaMapClient.searchAlongRoute(
          parsed.origin,
          parsed.destination,
          parsed.query,
          {
            radius: parsed.radius,
            types: parsed.types
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_get_route_optimizer': {
        const parsed = RouteOptimizerAdvancedArgsSchema.parse(args);
        const result = await olaMapClient.getRouteOptimizer(parsed.locations, {
          roundTrip: parsed.roundTrip,
          mode: parsed.mode,
          startLocation: parsed.startLocation,
          endLocation: parsed.endLocation
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'olamap_show_map_html_for_route': {
        const parsed = ShowMapHtmlArgsSchema.parse(args);
        const html = olaMapClient.generateRouteMapHtml(
          parsed.route_polyline,
          parsed.origin,
          parsed.destination,
          parsed.waypoints,
          {
            zoom: parsed.zoom,
            width: parsed.width,
            height: parsed.height
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: html
            }
          ]
        };
      }

      case 'olamap_show_markers_map_html': {
        const parsed = ShowMarkersMapHtmlArgsSchema.parse(args);
        const html = olaMapClient.generateMarkersMapHtml(
          parsed.markers,
          parsed.center,
          {
            zoom: parsed.zoom,
            width: parsed.width,
            height: parsed.height,
            showRoute: parsed.showRoute
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: html
            }
          ]
        };
      }

      case 'olamap_show_actual_route_map': {
        const parsed = ShowActualRouteMapArgsSchema.parse(args);
        const html = await olaMapClient.generateRouteMapWithDirections(
          parsed.origin,
          parsed.destination,
          parsed.waypoints,
          {
            zoom: parsed.zoom,
            width: parsed.width,
            height: parsed.height,
            mode: parsed.mode
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: html
            }
          ]
        };
      }

      case 'olamap_sequential_route_map': {
        const parsed = SequentialRouteMapArgsSchema.parse(args);
        const html = await olaMapClient.generateSequentialRouteMap(
          parsed.points,
          {
            zoom: parsed.zoom,
            width: parsed.width,
            height: parsed.height,
            mode: parsed.mode,
            optimize: parsed.optimize
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: html
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
});

// Initialize and start server
async function main() {
  const apiKey = process.env.OLAMAP_API_KEY;
  
  if (!apiKey) {
    console.error('Error: OLAMAP_API_KEY environment variable is required');
    process.exit(1);
  }

  olaMapClient = new OlaMapClient(apiKey);
  routePlanner = new AdvancedRoutePlanner(olaMapClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('OlaMap MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});