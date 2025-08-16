/**
 * OlaMap MCP Prompts Definitions
 * 
 * Prompt definitions following MCP schema patterns
 */

import { Prompt } from '@modelcontextprotocol/sdk/types.js';

export const OLAMAP_PROMPTS: Prompt[] = [
  {
    name: 'plan-street-route',
    description: 'Plan an optimized route with street-level navigation between multiple locations',
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
      },
      {
        name: 'optimize',
        description: 'Whether to optimize the route order (true/false)',
        required: false
      },
      {
        name: 'include_map',
        description: 'Whether to generate an interactive map (true/false)',
        required: false
      }
    ]
  },

  {
    name: 'find-nearby-with-routes',
    description: 'Find nearby places and show routes to them with street-level navigation',
    arguments: [
      {
        name: 'location',
        description: 'Center location (address or coordinates)',
        required: true
      },
      {
        name: 'type',
        description: 'Type of places to find (restaurant, hospital, school, etc.)',
        required: true
      },
      {
        name: 'radius',
        description: 'Search radius in meters',
        required: false
      },
      {
        name: 'show_routes',
        description: 'Whether to show routes to found places (true/false)',
        required: false
      }
    ]
  },

  {
    name: 'comprehensive-trip-planner',
    description: 'Plan a comprehensive trip with time constraints, multiple stops, and street-level routing',
    arguments: [
      {
        name: 'destinations',
        description: 'List of destinations to visit',
        required: true
      },
      {
        name: 'start_time',
        description: 'Trip start time (HH:MM format)',
        required: true
      },
      {
        name: 'end_time',
        description: 'Trip end time (HH:MM format)',
        required: true
      },
      {
        name: 'vehicle_type',
        description: 'Vehicle type (car, bike, walking)',
        required: false
      },
      {
        name: 'include_pois',
        description: 'Whether to include points of interest along the route',
        required: false
      }
    ]
  },

  {
    name: 'business-route-optimizer',
    description: 'Optimize business routes for sales visits, deliveries, or service calls',
    arguments: [
      {
        name: 'business_type',
        description: 'Type of business (sales, delivery, service)',
        required: true
      },
      {
        name: 'client_locations',
        description: 'List of client/customer locations',
        required: true
      },
      {
        name: 'working_hours',
        description: 'Working hours (e.g., 09:00-17:00)',
        required: false
      },
      {
        name: 'vehicle_constraints',
        description: 'Vehicle limitations or requirements',
        required: false
      }
    ]
  },

  {
    name: 'location-analysis-report',
    description: 'Generate comprehensive location analysis with accessibility, amenities, and routing',
    arguments: [
      {
        name: 'location',
        description: 'Location to analyze (address or coordinates)',
        required: true
      },
      {
        name: 'analysis_type',
        description: 'Type of analysis (residential, commercial, industrial)',
        required: false
      },
      {
        name: 'radius',
        description: 'Analysis radius in meters',
        required: false
      },
      {
        name: 'include_routes',
        description: 'Whether to include route analysis to key destinations',
        required: false
      }
    ]
  }
];

export const PROMPT_HANDLERS = {
  'plan-street-route': async (args: Record<string, string>) => {
    const locations = args.locations?.split(',').map(loc => loc.trim()) || [];
    const mode = args.mode || 'driving';
    const optimize = args.optimize === 'true';
    const includeMap = args.include_map === 'true';

    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text',
          text: `Plan an optimized route with street-level navigation for these locations: ${locations.join(', ')}.

Travel mode: ${mode}
Optimize route order: ${optimize ? 'Yes' : 'No'}
Generate interactive map: ${includeMap ? 'Yes' : 'No'}

Please provide:
1. Optimized route order (if requested)
2. Turn-by-turn directions with street names
3. Distance and time estimates for each segment
4. Interactive map visualization (if requested)
5. Key roads and landmarks along the route

Use the OlaMap tools to generate street-level routing that follows actual road networks, not straight lines.`
        }
      }]
    };
  },

  'find-nearby-with-routes': async (args: Record<string, string>) => {
    const location = args.location;
    const type = args.type;
    const radius = args.radius || '5000';
    const showRoutes = args.show_routes === 'true';

    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text',
          text: `Find ${type} near ${location} within ${radius} meters.

Show routes to found places: ${showRoutes ? 'Yes' : 'No'}

Please provide:
1. List of nearby ${type} with details
2. Distance from the center location
3. Street-level routes to each place (if requested)
4. Interactive map showing all locations
5. Recommendations based on ratings and distance

Use OlaMap tools to find relevant places and generate accurate routing information.`
        }
      }]
    };
  }

  // Add more prompt handlers as needed...
};