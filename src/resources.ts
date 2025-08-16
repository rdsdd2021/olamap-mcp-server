/**
 * OlaMap MCP Resources Definitions
 * 
 * Resource definitions following MCP schema patterns
 */

import { Resource } from '@modelcontextprotocol/sdk/types.js';

export const OLAMAP_RESOURCES: Resource[] = [
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
  },
  
  {
    uri: 'olamap://templates',
    name: 'Workflow Templates',
    description: 'Pre-configured templates for common routing and mapping tasks',
    mimeType: 'application/json'
  },
  
  {
    uri: 'olamap://examples',
    name: 'Usage Examples',
    description: 'Common usage patterns and examples for OlaMap tools',
    mimeType: 'text/markdown'
  },
  
  {
    uri: 'olamap://street-routing-guide',
    name: 'Street-Level Routing Guide',
    description: 'Guide for using street-level routing features',
    mimeType: 'text/markdown'
  }
];

export const RESOURCE_CONTENT = {
  'olamap://api-docs': `# OlaMap MCP Server API Documentation

## Overview
The OlaMap MCP Server provides comprehensive location services with street-level accuracy:

### Core Features
- **Street-Level Routing**: Real road network navigation (not straight lines)
- **Turn-by-Turn Directions**: Detailed navigation with street names
- **Route Optimization**: Multi-stop route planning with constraints
- **Interactive Maps**: Rich HTML map visualization
- **POI Discovery**: Find places along routes
- **Address Intelligence**: Indian address validation and geocoding

### Key Improvements
- ✅ Routes follow actual roads with turn-by-turn navigation
- ✅ Street names in directions (Hill Cart Road, Bidhan Road, etc.)
- ✅ Accurate distance and time estimates
- ✅ Interactive map visualization with animations
- ✅ Advanced route optimization algorithms

## Authentication
Set your OlaMap API key as the OLAMAP_API_KEY environment variable.
`,

  'olamap://place-types': {
    place_types: [
      'restaurant', 'cafe', 'hospital', 'school', 'university',
      'bank', 'atm', 'gas_station', 'shopping_mall', 'store',
      'tourist_attraction', 'museum', 'park', 'hotel',
      'airport', 'train_station', 'bus_station', 'pharmacy',
      'police', 'fire_station', 'government', 'post_office',
      'temple', 'mosque', 'church', 'gurudwara'
    ],
    description: 'Supported place types for search and filtering operations'
  },

  'olamap://travel-modes': {
    travel_modes: [
      {
        mode: 'driving',
        description: 'Car/vehicle routing with traffic considerations and street-level accuracy'
      },
      {
        mode: 'walking',
        description: 'Pedestrian routing on walkable paths with turn-by-turn directions'
      },
      {
        mode: 'cycling',
        description: 'Bicycle routing on bike-friendly routes'
      }
    ]
  },

  'olamap://street-routing-guide': `# Street-Level Routing Guide

## What's New
The OlaMap MCP Server now provides **true street-level routing** that follows actual road networks instead of straight-line interpolation.

## Key Features

### 1. Real Road Network Navigation
- Routes follow actual streets and roads
- Turn-by-turn directions with specific street names
- Accurate distance and time calculations
- Traffic-aware routing

### 2. Detailed Navigation Instructions
- Street names in directions (e.g., "Turn left onto Hill Cart Road")
- Specific maneuvers and distances
- Landmark references where available
- Arrival instructions

### 3. Interactive Map Visualization
- Routes displayed on actual road networks
- Turn-by-turn markers at key intersections
- Animated route visualization
- Multiple map themes and styling options

## Example Usage

### Basic Directions
\`\`\`
olamap_get_directions({
  origin: "26.6849,88.4426",
  destination: "26.7388,88.4342",
  mode: "driving"
})
\`\`\`

### Route Optimization
\`\`\`
olamap_optimize_route({
  locations: [
    {name: "NJP Station", coordinates: "26.6849,88.4426"},
    {name: "Cosmos Mall", coordinates: "26.7388,88.4342"}
  ],
  optimization_goal: "time"
})
\`\`\`

## Benefits
- ✅ No more straight-line routing
- ✅ Realistic travel times and distances
- ✅ Proper navigation instructions
- ✅ Street-level accuracy for Indian roads
`
};