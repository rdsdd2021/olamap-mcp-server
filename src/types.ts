/**
 * TypeScript type definitions for OlaMap API responses
 */

// Common types
export interface Location {
  lat: number;
  lng: number;
}

export interface Viewport {
  northeast: Location;
  southwest: Location;
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Places API types
export interface AutocompleteResponse {
  predictions: AutocompletePrediction[];
  status: string;
  error_message?: string;
  info_messages?: string[];
}

export interface AutocompletePrediction {
  description: string;
  place_id: string;
  reference: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: any[];
    secondary_text_matched_substrings?: any[];
  };
  terms: any[];
  types: string[];
  geometry: {
    location: Location;
  };
  distance_meters?: number;
  matched_substrings?: any[];
  layer?: string[];
}

export interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
  error_message?: string;
  info_messages?: string[];
}

export interface PlaceDetails {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: {
    location: Location;
    viewport?: Viewport;
  };
  place_id: string;
  name: string;
  types: string[];
  business_status?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    periods: any[];
    weekday_text: string[];
  };
  photos?: any[];
  layer?: string[];
  // Advanced details
  amenities_available?: string[];
  wheelchair_accessibility?: boolean;
  parking_available?: boolean;
  is_landmark?: boolean;
  landmark_type?: string;
  payment_mode?: string;
  popular_items?: string[];
  language_spoken?: string;
}

export interface AddressValidationResponse {
  result: {
    validated: boolean;
    validated_address: string;
    address_components: Array<{
      [key: string]: {
        componentName: string;
        componentType: string;
        componentStatus: string;
        componentDetails: string;
      };
    }>;
  };
  status: string;
  error_message?: string;
  info_messages?: string[];
}

// Geocoding API types
export interface GeocodeResponse {
  geocodingResults: GeocodeResult[];
  status: string;
  error_message?: string;
}

export interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: Location;
    viewport?: Viewport;
    location_type: string;
  };
  address_components: AddressComponent[];
  place_id: string;
  types: string[];
  layer?: string[];
}

// Routing API types
export interface DistanceMatrixResponse {
  rows: DistanceMatrixRow[];
  status: string;
  error_message?: string;
}

export interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

export interface DistanceMatrixElement {
  distance: number;
  duration: number;
  polyline?: string;
  status: string;
}

// Roads API types
export interface SnapToRoadResponse {
  status: string;
  snapped_points: SnappedPoint[];
}

export interface SnappedPoint {
  location: Location;
  snapped_type: string;
  original_index: number;
}

export interface NearestRoadsResponse {
  status: string;
  results: NearestRoadResult[];
}

export interface NearestRoadResult {
  lat: number;
  lng: number;
  distance: number;
  snap_type: string;
  status: string;
  original_index: string;
}

export interface SpeedLimitsResponse {
  status: string;
  snapped_points: Array<{
    original_index: number;
    location: {
      latitude: number;
      longitude: number;
    };
  }>;
  speed_limits: Array<{
    original_index: number;
    speed_limit: number;
  }>;
}

// Elevation API types
export interface ElevationResponse {
  results: ElevationResult[];
  status: string;
  error_message?: string;
  info_messages?: string[];
}

export interface ElevationResult {
  elevation: number;
  location: Location | {
    lat: string;
    lng: string;
  };
}

// Tiles API types
export interface MapStyle {
  version: number;
  name: string;
  id: string;
  url: string;
}

export interface StyleConfig {
  version: number;
  name: string;
  metadata: any;
  sources: any;
  sprite: string;
  glyphs: string;
  layers: any[];
}

export interface TilesetConfig {
  asset: {
    version: string;
  };
  geometricError: number;
  properties?: any;
  root: {
    boundingVolume: any;
    children?: any[];
    content?: any;
    geometricError: number;
    refine?: string;
    transform?: number[];
  };
}