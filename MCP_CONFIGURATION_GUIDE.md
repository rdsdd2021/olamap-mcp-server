# OlaMap MCP Server - Configuration Guide

## 🚀 Universal Installation & Configuration

Your OlaMap MCP Server (v1.0.2) is now published and ready to use with **any MCP client**!

### 📦 Package Information
- **NPM Package**: `olamap-mcp-server@1.0.2`
- **GitHub**: https://github.com/rdsdd2021/olamap-mcp-server
- **Binaries**: `olamap-mcp-server`, `mcp-server-olamap`

## 🔧 Configuration Options

### Option 1: NPX (Recommended - Works Everywhere)
```json
{
  "command": "npx",
  "args": ["-y", "olamap-mcp-server@1.0.2"],
  "env": {
    "OLAMAP_API_KEY": "your-actual-api-key-here"
  }
}
```

### Option 2: Global Installation
```bash
npm install -g olamap-mcp-server@1.0.2
```
```json
{
  "command": "olamap-mcp-server",
  "env": {
    "OLAMAP_API_KEY": "your-actual-api-key-here"
  }
}
```

### Option 3: UVX (Python Package Manager)
```json
{
  "command": "uvx",
  "args": ["olamap-mcp-server@1.0.2"],
  "env": {
    "OLAMAP_API_KEY": "your-actual-api-key-here"
  }
}
```

### Option 4: Node Direct (Local Development)
```json
{
  "command": "node",
  "args": ["C:\\path\\to\\olamap-mcp-server\\dist\\index.js"],
  "env": {
    "OLAMAP_API_KEY": "your-actual-api-key-here"
  }
}
```

## 🎯 Client-Specific Configurations

### Claude Desktop
**File**: `%APPDATA%/Claude/claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "olamap": {
      "command": "npx",
      "args": ["-y", "olamap-mcp-server@1.0.2"],
      "env": {
        "OLAMAP_API_KEY": "your-actual-api-key-here"
      }
    }
  }
}
```

### n8n MCP Integration
```json
{
  "command": "npx",
  "args": ["-y", "olamap-mcp-server@1.0.2"],
  "env": {
    "OLAMAP_API_KEY": "your-actual-api-key-here"
  }
}
```

### Kiro IDE
**Workspace**: `.kiro/settings/mcp.json`
**User**: `~/.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "olamap": {
      "command": "npx",
      "args": ["-y", "olamap-mcp-server@1.0.2"],
      "env": {
        "OLAMAP_API_KEY": "your-actual-api-key-here"
      },
      "disabled": false,
      "autoApprove": [
        "olamap_autocomplete",
        "olamap_place_details",
        "olamap_nearby_search",
        "olamap_text_search",
        "olamap_geocode",
        "olamap_reverse_geocode",
        "olamap_distance_matrix",
        "olamap_plan_trip",
        "olamap_find_locations",
        "olamap_optimize_route"
      ]
    }
  }
}
```

## 🔑 Getting Your OlaMap API Key

1. Visit [OlaMap Developer Portal](https://maps.olakrutrim.com/)
2. Sign up for a free account
3. Create a new project
4. Generate an API key
5. Replace `"your-actual-api-key-here"` with your real API key

## 🧪 Testing Your Installation

### Command Line Test
```bash
# Set your API key
set OLAMAP_API_KEY=your-actual-api-key-here

# Test the server
npx -y olamap-mcp-server@1.0.2

# Should output: "OlaMap MCP Server running on stdio"
```

### Available Tools
Your server provides 17 powerful tools:

**Location Services:**
- `olamap_autocomplete` - Place suggestions
- `olamap_place_details` - Detailed place information
- `olamap_nearby_search` - Find nearby places
- `olamap_text_search` - Natural language search

**Geocoding:**
- `olamap_geocode` - Address to coordinates
- `olamap_reverse_geocode` - Coordinates to address
- `olamap_validate_address` - Address validation

**Routing & Navigation:**
- `olamap_distance_matrix` - Distance/time calculations
- `olamap_snap_to_road` - GPS coordinate snapping
- `olamap_nearest_roads` - Find nearest roads
- `olamap_speed_limits` - Road speed limits

**Advanced Features:**
- `olamap_plan_trip` - AI-powered trip planning
- `olamap_find_locations` - Smart location discovery
- `olamap_optimize_route` - Route optimization

**Maps & Elevation:**
- `olamap_elevation` - Elevation data
- `olamap_map_styles` - Available map styles
- `olamap_3d_tileset` - 3D map configuration

## 🐛 Troubleshooting

### "Connection closed" Error
- **Cause**: Missing or invalid API key
- **Solution**: Verify your `OLAMAP_API_KEY` is correct

### Windows NPX Issues
- **Cause**: File permission problems
- **Solutions**:
  1. Use global installation
  2. Run as administrator
  3. Use node directly

### Module Not Found
- **Cause**: Package installation issues
- **Solution**: Clear cache and reinstall:
  ```bash
  npm cache clean --force
  npx -y olamap-mcp-server@1.0.2
  ```

## ✅ Success Indicators

When working correctly, you should see:
- Server starts with: `"OlaMap MCP Server running on stdio"`
- No error messages about missing API keys
- Tools are available in your MCP client
- API calls return location data from India

## 🎉 You're Ready!

Your OlaMap MCP Server is now configured and ready to provide intelligent location services and trip planning for India! 🇮🇳

Try asking your AI assistant:
- "Find restaurants near Connaught Place, Delhi"
- "Plan a trip to visit 5 temples in Bengaluru tomorrow"
- "What's the distance between Mumbai Airport and Taj Hotel?"
- "Optimize my route for these 8 client meetings in Pune"