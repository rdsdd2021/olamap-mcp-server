/**
 * OlaMap MCP Tools Definitions
 * 
 * Comprehensive tool definitions following MCP schema patterns
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const OLAMAP_TOOLS: Tool[] = [
  // Core Places API Tools
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
      required: ['input'],
      additionalProperties: false
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
      required: ['place_id'],
      additionalProperties: false
    }
  },

  // Advanced Routing Tools
  {
    name: 'olamap_get_directions',
    description: 'Get street-level turn-by-turn directions following real road networks',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Starting point as coordinates "lat,lng" or address'
        },
        destination: {
          type: 'string',
          description: 'Ending point as coordinates "lat,lng" or address'
        },
        waypoints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional waypoints as coordinates or addresses'
        },
        mode: {
          type: 'string',
          enum: ['driving', 'walking', 'cycling'],
          description: 'Travel mode',
          default: 'driving'
        },
        alternatives: {
          type: 'boolean',
          description: 'Return alternative routes',
          default: false
        },
        avoid: {
          type: 'string',
          description: 'Avoid tolls, highways, ferries'
        }
      },
      required: ['origin', 'destination'],
      additionalProperties: false
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
              priority: { 
                type: 'string', 
                enum: ['high', 'medium', 'low'], 
                default: 'medium' 
              }
            },
            required: ['name', 'coordinates'],
            additionalProperties: false
          },
          minItems: 2
        },
        start_location: {
          type: 'string',
          description: 'Starting point coordinates "lat,lng"'
        },
        end_location: {
          type: 'string',
          description: 'Ending point coordinates "lat,lng" (optional)'
        },
        vehicle_type: {
          type: 'string',
          enum: ['car', 'bike', 'walking'],
          default: 'car'
        },
        optimization_goal: {
          type: 'string',
          enum: ['time', 'distance', 'balanced'],
          default: 'time'
        }
      },
      required: ['locations'],
      additionalProperties: false
    }
  }
];

// Add more tools as needed...