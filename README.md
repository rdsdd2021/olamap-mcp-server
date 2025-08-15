# OlaMap MCP Server

A powerful Model Context Protocol (MCP) server that provides comprehensive access to OlaMap APIs for location services, routing, and interactive map visualization across India.

## 🚀 Features

### 🗺️ **Interactive Map Generation**
- **Sequential Route Maps** - Point-to-point routing with optimization (A→B→C→D)
- **HTML Map Visualization** - Ready-to-use interactive maps with Leaflet.js
- **Custom Markers & Routes** - Professional styling with route statistics
- **Real Polyline Decoding** - Actual road paths, not straight lines

### 📍 **Location Services**
- **Place Search & Autocomplete** - Find restaurants, schools, hospitals, etc.
- **Address Validation** - Validate and standardize Indian addresses
- **Geocoding & Reverse Geocoding** - Convert between addresses and coordinates
- **Nearby Search** - Find places within specified radius with filters

### 🛣️ **Advanced Routing**
- **Turn-by-Turn Directions** - Real routing between multiple points
- **Route Optimization** - Minimize travel time and distance
- **Sequential Routing** - Individual API calls for each segment
- **Distance Matrix** - Calculate distances and times between multiple points
- **Search Along Route** - Find POIs (gas stations, restaurants) along routes

### 🎯 **Trip Planning**
- **Multi-Location Trips** - Plan visits to 3-10+ locations with constraints
- **Vehicle-Specific Planning** - Optimize for car, bike, walking, or public transport
- **Time Constraints** - Consider business hours, breaks, and appointments
- **Feasibility Analysis** - Identify impossible plans and suggest alternatives

## 📦 Installation

### NPX (Recommended)
```bash
npx -y olamap-mcp-server@latest
```

### Global Installation
```bash
npm install -g olamap-mcp-server@latest
olamap-mcp-server
```

## ⚙️ Configuration

### Claude Desktop
Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "olamap": {
      "command": "npx",
      "args": ["-y", "olamap-mcp-server@latest"],
      "env": {
        "OLAMAP_API_KEY": "your_olamap_api_key_here"
      }
    }
  }
}
```

### Kiro IDE
Add to your Kiro MCP configuration:

```json
{
  "mcpServers": {
    "olamap": {
      "command": "npx",
      "args": ["-y", "olamap-mcp-server@latest"],
      "env": {
        "OLAMAP_API_KEY": "your_olamap_api_key_here"
      },
      "disabled": false,
      "autoApprove": [
        "olamap_sequential_route_map",
        "olamap_show_actual_route_map",
        "olamap_show_markers_map_html",
        "olamap_autocomplete",
        "olamap_place_details",
        "olamap_get_directions"
      ]
    }
  }
}
```

### Get Your API Key
1. Visit [OlaMap Developer Portal](https://maps.olakrutrim.com/)
2. Sign up and create a project
3. Generate an API key
4. Add it to your configuration

## 🛠️ Available Tools

| Category | Tool | Description |
|----------|------|-------------|
| **Sequential Routing** | `olamap_sequential_route_map` | Generate optimized route with point-to-point routing (A→B→C→D) |
| **Interactive Maps** | `olamap_show_actual_route_map` | Generate HTML map with actual routed paths |
| | `olamap_show_markers_map_html` | Generate HTML map with markers and optional routes |
| | `olamap_show_map_html_for_route` | Generate HTML map with polyline visualization |
| **Places & Search** | `olamap_autocomplete` | Get place suggestions with autocomplete |
| | `olamap_place_details` | Get detailed place information |
| | `olamap_nearby_search` | Find nearby places |
| | `olamap_text_search` | Natural language place search |
| | `olamap_get_photo` | Fetch place photos from references |
| **Routing & Directions** | `olamap_get_directions` | Get turn-by-turn directions between points |
| | `olamap_search_along_route` | Find POIs along a specified route |
| | `olamap_get_route_optimizer` | Advanced route optimization with round-trip |
| | `olamap_distance_matrix` | Calculate distance/time matrix |
| **Trip Planning** | `olamap_plan_trip` | Plan complex multi-location trips with constraints |
| | `olamap_find_locations` | Find and suggest locations by criteria |
| | `olamap_optimize_route` | Optimize route order to minimize travel time |
| **Geocoding** | `olamap_geocode` | Convert addresses to coordinates |
| | `olamap_reverse_geocode` | Convert coordinates to addresses |
| | `olamap_validate_address` | Validate Indian addresses |
| **Roads & Navigation** | `olamap_snap_to_road` | Snap GPS coordinates to roads |
| | `olamap_nearest_roads` | Find nearest roads |
| | `olamap_speed_limits` | Get road speed limits |
| **Elevation & Maps** | `olamap_elevation` | Get elevation for coordinates |
| | `olamap_map_styles` | Get available map styles |

## 🎯 Usage Examples

### Sequential Route Planning
```javascript
// Plan optimized route through multiple stops
olamap_sequential_route_map({
  points: [
    { lat: 12.9716, lng: 77.5946, name: "Cubbon Park" },
    { lat: 12.9352, lng: 77.6245, name: "Koramangala" },
    { lat: 12.9698, lng: 77.7500, name: "Whitefield" },
    { lat: 12.9279, lng: 77.6271, name: "BTM Layout" }
  ],
  mode: "driving",
  optimize: true
})
```

### Interactive Map Generation
```javascript
// Generate HTML map with markers and routes
olamap_show_markers_map_html({
  markers: [
    { lat: 12.9716, lng: 77.5946, title: "Start Point" },
    { lat: 12.9352, lng: 77.6245, title: "End Point" }
  ],
  showRoute: true,
  zoom: 12
})
```

### Trip Planning
```javascript
// Plan a complex multi-location trip
olamap_plan_trip({
  locations: [
    { name: "School A", coordinates: "12.9716,77.5946", visit_duration_minutes: 30 },
    { name: "School B", coordinates: "12.9352,77.6245", visit_duration_minutes: 45 }
  ],
  vehicle: { type: "car" },
  constraints: { start_time: "09:00", end_time: "17:00" }
})
```

## 🎨 Key Features

### Sequential Routing
- **Point-to-Point Optimization**: Makes individual API calls for each segment (A→B, B→C, C→D)
- **Route Order Optimization**: Uses nearest neighbor algorithm for shortest total distance
- **Real Route Data**: Decodes actual polylines from OlaMap directions API
- **Professional Visualization**: Shows detailed segment information and statistics

### Interactive Maps
- **Leaflet.js Integration**: Professional mapping library with smooth interactions
- **Custom Styling**: Beautiful markers, route lines, and popups
- **Responsive Design**: Works on different screen sizes
- **Auto-fitting Bounds**: Automatically zooms to show entire route

### Fallback Support
- **Curved Routes**: Generates realistic Bezier curves when API is unavailable
- **Graceful Degradation**: Always provides useful output even without API key
- **Error Handling**: Comprehensive error handling with meaningful messages

## 🔧 Development

### Build from Source
```bash
git clone https://github.com/your-username/olamap-mcp-server.git
cd olamap-mcp-server
npm install
npm run build
```

### Run Tests
```bash
npm test
```

### Local Development
```bash
npm run dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/olamap-mcp-server/issues)
- **Documentation**: [OlaMap API Docs](https://maps.olakrutrim.com/docs)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Made with ❤️ for the Indian mapping ecosystem**