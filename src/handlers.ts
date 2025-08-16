/**
 * OlaMap MCP Request Handlers
 * 
 * Implements all MCP request handlers following best practices
 */

import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { OlaMapClient } from './olamap-client.js';
import { AdvancedRoutePlanner } from './route-planner.js';
import { generateRouteMapHTML } from './map-generator.js';
import { OLAMAP_TOOLS } from './tools.js';
import { OLAMAP_RESOURCES, RESOURCE_CONTENT } from './resources.js';
import { OLAMAP_PROMPTS, PROMPT_HANDLERS } from './prompts.js';

// Create server instance
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

/**
 * List Tools Handler
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: OLAMAP_TOOLS };
});

/**
 * List Resources Handler
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: OLAMAP_RESOURCES };
});

/**
 * Read Resource Handler
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
  const { uri } = request.params;

  if (!RESOURCE_CONTENT.hasOwnProperty(uri)) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Unknown resource: ${uri}`
    );
  }

  const content = RESOURCE_CONTENT[uri as keyof typeof RESOURCE_CONTENT];
  
  return {
    contents: [{
      uri,
      mimeType: uri.includes('json') ? 'application/json' : 'text/markdown',
      text: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    }]
  };
});

/**
 * List Prompts Handler
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: OLAMAP_PROMPTS };
});

/**
 * Get Prompt Handler
 */
server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;
  
  if (!PROMPT_HANDLERS.hasOwnProperty(name)) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Unknown prompt: ${name}`
    );
  }

  const handler = PROMPT_HANDLERS[name as keyof typeof PROMPT_HANDLERS];
  return await handler(args || {});
});

// Initialize clients
const apiKey = process.env.OLAMAP_API_KEY;
let olaMapClient: OlaMapClient | null = null;
let routePlanner: AdvancedRoutePlanner | null = null;

if (apiKey) {
  olaMapClient = new OlaMapClient(apiKey);
  routePlanner = new AdvancedRoutePlanner(olaMapClient);
}

/**
 * Call Tool Handler
 */
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

      // Add more tool handlers...

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

export { server };