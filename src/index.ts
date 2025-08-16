#!/usr/bin/env node

/**
 * OlaMap MCP Server - Main Entry Point
 * 
 * A comprehensive Model Context Protocol server for OlaMap APIs
 * with street-level routing, advanced optimization, and interactive maps
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
  Resource,
  Prompt,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { OlaMapClient } from './olamap-client.js';
import { AdvancedRoutePlanner } from './route-planner.js';
import { generateRouteMapHTML, generateMarkersMapHTML } from './map-generator.js';

const server = new Server(
  {
    name: 'olamap-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Initialize OlaMap client and route planner
let olaMapClient: OlaMapClient | null = null;
let routePlanner: AdvancedRoutePlanner | null = null;

const apiKey = process.env.OLAMAP_API_KEY;
if (apiKey) {
  olaMapClient = new OlaMapClient(apiKey);
  routePlanner = new AdvancedRoutePlanner(olaMapClient);
}

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
          description: 'Travel mode (driving, walking, cycling)',
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
      required: ['origin', 'destination']
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
    name: 'olamap_show_actual_route_map',
    description: 'Generate HTML map with actual routed path using OlaMap directions API',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Starting point coordinates "lat,lng" or address'
        },
        destination: {
          type: 'string',
          description: 'Ending point coordinates "lat,lng" or address'
        },
        waypoints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional waypoints coordinates or addresses'
        },
        mode: {
          type: 'string',
          description: 'Travel mode (driving, walking, cycling)',
          default: 'driving'
        },
        zoom: {
          type: 'number',
          description: 'Map zoom level',
          default: 12
        },
        width: {
          type: 'number',
          description: 'Map width in pixels',
          default: 800
        },
        height: {
          type: 'number',
          description: 'Map height in pixels',
          default: 600
        }
      },
      required: ['origin', 'destination']
    }
  }
];

// Resource definitions
const resources: Resource[] = [
  {
    uri: 'olamap://api-docs',
    name: 'OlaMap API Documentation',
    description: 'Complete documentation for all OlaMap API endpoints and capabilities',
    mimeType: 'text/markdown'
  },
  {
    uri: 'olamap://place-types',
    name: 'Supported Place Types',
    description: 'List of all supported place types for search and filtering',
    mimeType: 'application/json'
  },
  {
    uri: 'olamap://travel-modes',
    name: 'Travel Modes',
    description: 'Available travel modes for routing and directions',
    mimeType: 'application/json'
  }
];

// Prompt definitions
const prompts: Prompt[] = [
  {
    name: 'plan-route',
    description: 'Plan an optimized route between multiple locations',
    arguments: [
      {
        name: 'locations',
        description: 'Comma-separated list of location names or addresses',
        required: true
      },
      {
        name: 'mode',
        description: 'Travel mode (driving, walking, cycling)',
        required: false
      }
    ]
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});

// List prompts handler
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
  const { uri } = request.params;

  switch (uri) {
    case 'olamap://api-docs':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# OlaMap MCP Server API Documentation

## Overview
The OlaMap MCP Server provides comprehensive location services including:
- Place search and autocomplete
- Street-level routing with turn-by-turn directions
- Interactive map visualization
- Route optimization

## Available Tools
${tools.map(tool => `### ${tool.name}\n${tool.description}\n`).join('\n')}

## Authentication
Set your OlaMap API key as the OLAMAP_API_KEY environment variable.
`
          }
        ]
      };

    case 'olamap://place-types':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              place_types: [
                'restaurant', 'cafe', 'hospital', 'school', 'university',
                'bank', 'atm', 'gas_station', 'shopping_mall', 'store',
                'tourist_attraction', 'museum', 'park', 'hotel',
                'airport', 'train_station', 'bus_station', 'pharmacy'
              ],
              description: 'Supported place types for search and filtering operations'
            }, null, 2)
          }
        ]
      };

    case 'olamap://travel-modes':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              travel_modes: [
                {
                  mode: 'driving',
                  description: 'Car/vehicle routing with traffic considerations'
                },
                {
                  mode: 'walking',
                  description: 'Pedestrian routing on walkable paths'
                },
                {
                  mode: 'cycling',
                  description: 'Bicycle routing on bike-friendly routes'
                }
              ]
            }, null, 2)
          }
        ]
      };

    default:
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource: ${uri}`
      );
  }
});

// Get prompt handler
server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'plan-route') {
    const locations = args?.locations?.split(',').map((loc: string) => loc.trim()) || [];
    const mode = args?.mode || 'driving';

    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text',
          text: `Plan an optimized route for these locations: ${locations.join(', ')}.
Travel mode: ${mode}

Please provide:
1. Turn-by-turn directions with street names
2. Distance and time estimates
3. Interactive map visualization

Use the OlaMap tools to generate street-level routing that follows actual road networks.`
        }
      }]
    };
  }

  throw new McpError(
    ErrorCode.InvalidRequest,
    `Unknown prompt: ${name}`
  );
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  if (!olaMapClient) {
    throw new McpError(
      ErrorCode.InternalError,
      'OlaMap client not initialized. Please set OLAMAP_API_KEY environment variable.'
    );
  }

  if (!args) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      'Tool arguments are required'
    );
  }

  try {
    switch (name) {
      case 'olamap_autocomplete':
        const autocompleteResult = await olaMapClient.autocomplete(
          args.input as string,
          args.location as string,
          { radius: args.radius as string, types: args.types as string }
        );
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(autocompleteResult, null, 2)
          }]
        };

      case 'olamap_place_details':
        const placeDetails = await olaMapClient.getPlaceDetails(
          args.place_id as string,
          (args.advanced as boolean) || false
        );
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(placeDetails, null, 2)
          }]
        };

      case 'olamap_get_directions':
        const directions = await olaMapClient.getDirections(
          args.origin as string,
          args.destination as string,
          args.waypoints as string[],
          {
            mode: args.mode as string,
            alternatives: args.alternatives as boolean,
            avoid: args.avoid as string
          }
        );
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(directions, null, 2)
          }]
        };

      case 'olamap_text_search':
        const textSearchResult = await olaMapClient.textSearch(
          args.input as string,
          args.location as string,
          args.radius as string
        );
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(textSearchResult, null, 2)
          }]
        };

      case 'olamap_show_actual_route_map':
        // Get directions first
        const routeDirections = await olaMapClient.getDirections(
          args.origin as string,
          args.destination as string,
          args.waypoints as string[],
          { mode: args.mode as string }
        );

        if (!routeDirections.routes || routeDirections.routes.length === 0) {
          throw new Error('No route found');
        }

        const route = routeDirections.routes[0];
        const polyline = route.overview_polyline?.points;

        if (!polyline) {
          throw new Error('No polyline data in route');
        }

        const mapHtml = generateRouteMapHTML({
          origin: args.origin as string,
          destination: args.destination as string,
          waypoints: args.waypoints as string[] || [],
          routePolyline: polyline,
          width: args.width as number || 800,
          height: args.height as number || 600,
          zoom: args.zoom as number || 12
        });

        return {
          content: [{
            type: 'text',
            text: mapHtml
          }]
        };

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OlaMap MCP Server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { server };