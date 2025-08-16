/**
 * OlaMap MCP Server Tests
 * 
 * Comprehensive tests for the MCP server implementation
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { OLAMAP_TOOLS } from '../tools.js';
import { OLAMAP_RESOURCES } from '../resources.js';
import { OLAMAP_PROMPTS } from '../prompts.js';
import { OlaMapClient } from '../olamap-client.js';

describe('OlaMap MCP Server', () => {
  describe('Tools Configuration', () => {
    test('should have all required tools defined', () => {
      expect(OLAMAP_TOOLS).toBeDefined();
      expect(Array.isArray(OLAMAP_TOOLS)).toBe(true);
      expect(OLAMAP_TOOLS.length).toBeGreaterThan(0);
    });

    test('should have proper tool schema structure', () => {
      OLAMAP_TOOLS.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema).toHaveProperty('required');
        expect(tool.inputSchema).toHaveProperty('additionalProperties', false);
      });
    });

    test('should include core routing tools', () => {
      const toolNames = OLAMAP_TOOLS.map(tool => tool.name);
      expect(toolNames).toContain('olamap_get_directions');
      expect(toolNames).toContain('olamap_optimize_route');
      expect(toolNames).toContain('olamap_autocomplete');
      expect(toolNames).toContain('olamap_place_details');
    });
  });

  describe('Resources Configuration', () => {
    test('should have all required resources defined', () => {
      expect(OLAMAP_RESOURCES).toBeDefined();
      expect(Array.isArray(OLAMAP_RESOURCES)).toBe(true);
      expect(OLAMAP_RESOURCES.length).toBeGreaterThan(0);
    });

    test('should have proper resource structure', () => {
      OLAMAP_RESOURCES.forEach(resource => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
        expect(resource.uri).toMatch(/^olamap:\/\//);
      });
    });

    test('should include documentation resources', () => {
      const resourceUris = OLAMAP_RESOURCES.map(resource => resource.uri);
      expect(resourceUris).toContain('olamap://api-docs');
      expect(resourceUris).toContain('olamap://street-routing-guide');
      expect(resourceUris).toContain('olamap://place-types');
    });
  });

  describe('Prompts Configuration', () => {
    test('should have all required prompts defined', () => {
      expect(OLAMAP_PROMPTS).toBeDefined();
      expect(Array.isArray(OLAMAP_PROMPTS)).toBe(true);
      expect(OLAMAP_PROMPTS.length).toBeGreaterThan(0);
    });

    test('should have proper prompt structure', () => {
      OLAMAP_PROMPTS.forEach(prompt => {
        expect(prompt).toHaveProperty('name');
        expect(prompt).toHaveProperty('description');
        expect(prompt).toHaveProperty('arguments');
        expect(Array.isArray(prompt.arguments)).toBe(true);
      });
    });

    test('should include routing and planning prompts', () => {
      const promptNames = OLAMAP_PROMPTS.map(prompt => prompt.name);
      expect(promptNames).toContain('plan-street-route');
      expect(promptNames).toContain('comprehensive-trip-planner');
    });
  });

  describe('Schema Validation', () => {
    test('tools should have valid input schemas', () => {
      OLAMAP_TOOLS.forEach(tool => {
        const schema = tool.inputSchema;
        
        // Check required fields are arrays
        expect(Array.isArray(schema.required)).toBe(true);
        
        // Check properties exist
        expect(typeof schema.properties).toBe('object');
        
        // Check required properties exist in properties
        if (schema.required) {
          schema.required.forEach((requiredField: string) => {
            expect(schema.properties).toHaveProperty(requiredField);
          });
        }
      });
    });

    test('prompts should have valid argument definitions', () => {
      OLAMAP_PROMPTS.forEach(prompt => {
        if (prompt.arguments) {
          prompt.arguments.forEach(arg => {
            expect(arg).toHaveProperty('name');
            expect(arg).toHaveProperty('description');
            expect(arg).toHaveProperty('required');
            expect(typeof arg.required).toBe('boolean');
          });
        }
      });
    });
  });
});

describe('Street-Level Routing Features', () => {
  test('should have street routing tools', () => {
    const directionsTools = OLAMAP_TOOLS.filter(tool => 
      tool.name.includes('directions') || tool.name.includes('route')
    );
    expect(directionsTools.length).toBeGreaterThan(0);
  });

  test('should have map generation tools', () => {
    const mapTools = OLAMAP_TOOLS.filter(tool => 
      tool.name.includes('map') || tool.name.includes('show')
    );
    expect(mapTools.length).toBeGreaterThan(0);
  });

  test('should have optimization tools', () => {
    const optimizationTools = OLAMAP_TOOLS.filter(tool => 
      tool.name.includes('optimize') || tool.name.includes('plan')
    );
    expect(optimizationTools.length).toBeGreaterThan(0);
  });
});