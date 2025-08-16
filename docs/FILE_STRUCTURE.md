# OlaMap MCP Server - File Structure & Purpose

## 📁 Project Structure Overview

This document explains the purpose of each file and how they connect to form a comprehensive MCP server.

## 🚀 Core MCP Server Files

### `src/main.ts` - **Main Entry Point**
- **Purpose**: Application entry point and server initialization
- **Responsibilities**:
  - Initialize MCP server transport
  - Handle graceful shutdown
  - Error handling and logging
- **Connections**: Imports and starts the server from `handlers.ts`

### `src/mcp-server.ts` - **Server Configuration**
- **Purpose**: MCP server instance and global configuration
- **Responsibilities**:
  - Server configuration and capabilities
  - Global client instances (OlaMapClient, RoutePlanner, MapGenerator)
  - Initialization functions
- **Connections**: Exported to `handlers.ts` for use in request handlers

### `src/handlers.ts` - **MCP Request Handlers**
- **Purpose**: Implements all MCP protocol request handlers
- **Responsibilities**:
  - `ListToolsRequestSchema` handler
  - `ListResourcesRequestSchema` handler
  - `ReadResourceRequestSchema` handler
  - `ListPromptsRequestSchema` handler
  - `GetPromptRequestSchema` handler
  - `CallToolRequestSchema` handler
- **Connections**: Uses definitions from `tools.ts`, `resources.ts`, `prompts.ts`

### `src/tools.ts` - **Tool Definitions**
- **Purpose**: Define all available MCP tools with schemas
- **Responsibilities**:
  - Tool metadata (name, description)
  - Input schema validation
  - Parameter definitions
- **Connections**: Used by `handlers.ts` for tool listing and validation

### `src/resources.ts` - **Resource Definitions**
- **Purpose**: Define MCP resources and their content
- **Responsibilities**:
  - Resource metadata (URI, name, description)
  - Static resource content
  - Documentation and examples
- **Connections**: Used by `handlers.ts` for resource operations

### `src/prompts.ts` - **Prompt Definitions**
- **Purpose**: Define MCP prompts and their handlers
- **Responsibilities**:
  - Prompt metadata and arguments
  - Prompt handler functions
  - Template generation
- **Connections**: Used by `handlers.ts` for prompt operations

## 🗺️ OlaMap Integration Files

### `src/olamap-client.ts` - **OlaMap API Client**
- **Purpose**: Direct interface to OlaMap APIs
- **Responsibilities**:
  - API authentication and requests
  - Response parsing and error handling
  - Fallback mechanisms for failed requests
- **Connections**: Used by all tool handlers for API operations

### `src/route-planner.ts` - **Advanced Route Planning**
- **Purpose**: High-level route planning and optimization
- **Responsibilities**:
  - Multi-stop route optimization
  - Travel time calculations
  - Route constraint handling
- **Connections**: Uses `olamap-client.ts` for API calls

### `src/map-generator.ts` - **Interactive Map Generation**
- **Purpose**: Generate HTML maps with street-level routing
- **Responsibilities**:
  - HTML map template generation
  - Route visualization
  - Interactive features and styling
- **Connections**: Uses route data from other modules

### `src/schemas.ts` - **Type Definitions & Validation**
- **Purpose**: TypeScript types and Zod schemas
- **Responsibilities**:
  - Input validation schemas
  - Type definitions for API responses
  - Data structure definitions
- **Connections**: Used throughout the codebase for type safety

## 📋 Configuration & Templates

### `.kiro/settings/mcp-templates.json` - **Workflow Templates**
- **Purpose**: Pre-configured templates for common use cases
- **Responsibilities**:
  - Business route optimization templates
  - Tourist itinerary templates
  - Emergency response templates
- **Connections**: Referenced by resource handlers

### `.kiro/settings/olamap-resources.json` - **Advanced Resources**
- **Purpose**: Advanced resource configurations
- **Responsibilities**:
  - Performance settings
  - Security configurations
  - Integration API definitions
- **Connections**: Used by resource handlers for advanced features

### `templates/` - **Template Files**
- **Purpose**: Reusable templates and utilities
- **Files**:
  - `olamap-workflow-templates.json`: Workflow definitions
  - `road-route-generator.js`: Route generation utilities
  - `comprehensive-siliguri-route-test.json`: Test scenarios
- **Connections**: Used by various handlers for template-based operations

## 📚 Documentation Files

### `docs/OLAMAP_MCP_GUIDE.md` - **User Guide**
- **Purpose**: Comprehensive user documentation
- **Content**: API usage, examples, best practices

### `COMPREHENSIVE_MCP_TEST_RESULTS.md` - **Test Results**
- **Purpose**: Validation and test results documentation
- **Content**: Feature testing, performance metrics, validation results

## 🔧 Build & Development Files

### `package.json` - **Project Configuration**
- **Purpose**: NPM package configuration
- **Key Settings**:
  - Entry point: `dist/main.js`
  - Binary executables
  - Dependencies and scripts

### `tsconfig.json` - **TypeScript Configuration**
- **Purpose**: TypeScript compilation settings
- **Connections**: Compiles all `.ts` files to `dist/` directory

### `dist/` - **Compiled Output**
- **Purpose**: Compiled JavaScript files for distribution
- **Generated From**: All TypeScript source files

## 🔗 File Connections & Data Flow

```
main.ts
  ↓
handlers.ts ← tools.ts, resources.ts, prompts.ts
  ↓
mcp-server.ts ← olamap-client.ts, route-planner.ts, map-generator.ts
  ↓
schemas.ts (types & validation)
```

## 🎯 Key Design Principles

1. **Separation of Concerns**: Each file has a specific, well-defined purpose
2. **MCP Compliance**: Follows MCP protocol specifications exactly
3. **Modular Architecture**: Components can be developed and tested independently
4. **Type Safety**: Full TypeScript coverage with Zod validation
5. **Error Handling**: Comprehensive error handling at all levels
6. **Extensibility**: Easy to add new tools, resources, and prompts

## 🚀 How It All Works Together

1. **Startup**: `main.ts` initializes the server and transport
2. **Configuration**: `mcp-server.ts` sets up global instances
3. **Request Handling**: `handlers.ts` processes MCP requests
4. **Tool Execution**: Handlers use client modules to execute operations
5. **Response**: Results are formatted and returned via MCP protocol

This architecture ensures a robust, maintainable, and extensible MCP server that provides comprehensive OlaMap functionality with street-level routing accuracy.