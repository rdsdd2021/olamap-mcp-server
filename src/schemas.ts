/**
 * Zod schemas for validating OlaMap API arguments
 */

import { z } from 'zod';

export const AutocompleteArgsSchema = z.object({
  input: z.string().min(1, 'Input query is required'),
  location: z.string().optional(),
  radius: z.string().optional(),
  types: z.string().optional()
});

export const PlaceDetailsArgsSchema = z.object({
  place_id: z.string().min(1, 'Place ID is required'),
  advanced: z.boolean().optional().default(false)
});

export const NearbySearchArgsSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  radius: z.string().optional(),
  types: z.string().optional(),
  limit: z.string().optional(),
  advanced: z.boolean().optional().default(false)
});

export const TextSearchArgsSchema = z.object({
  input: z.string().min(1, 'Input query is required'),
  location: z.string().optional(),
  radius: z.string().optional()
});

export const AddressValidationArgsSchema = z.object({
  address: z.string().min(1, 'Address is required')
});

export const GeocodeArgsSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  bounds: z.string().optional(),
  region: z.string().optional()
});

export const ReverseGeocodeArgsSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  result_type: z.string().optional()
});

export const DistanceMatrixArgsSchema = z.object({
  origins: z.array(z.string()).min(1, 'At least one origin is required'),
  destinations: z.array(z.string()).min(1, 'At least one destination is required'),
  mode: z.string().optional().default('driving'),
  units: z.string().optional().default('metric'),
  basic: z.boolean().optional().default(false)
});

export const SnapToRoadArgsSchema = z.object({
  points: z.array(z.string()).min(1, 'At least one point is required'),
  enhancePath: z.boolean().optional().default(false),
  interpolate: z.boolean().optional().default(true)
});

export const NearestRoadsArgsSchema = z.object({
  points: z.array(z.string()).min(1, 'At least one point is required'),
  mode: z.string().optional().default('DRIVING'),
  radius: z.number().optional().default(500)
});

export const SpeedLimitsArgsSchema = z.object({
  points: z.array(z.string()).min(1, 'At least one point is required'),
  snapStrategy: z.string().optional().default('snaptoroad')
});

export const ElevationArgsSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180')
});

export const MultipleElevationArgsSchema = z.object({
  coordinates: z.array(z.string()).min(1, 'At least one coordinate is required')
});

export const MapStylesArgsSchema = z.object({});

export const StyleConfigArgsSchema = z.object({
  style_name: z.string().min(1, 'Style name is required')
});

export const TripPlannerArgsSchema = z.object({
  locations: z.array(z.object({
    name: z.string().min(1, 'Location name is required'),
    address: z.string().optional(),
    coordinates: z.string().optional(),
    place_id: z.string().optional(),
    visit_duration_minutes: z.number().min(1, 'Visit duration must be at least 1 minute'),
    preferred_time: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
    notes: z.string().optional()
  })).min(1, 'At least one location is required'),
  vehicle: z.object({
    type: z.enum(['car', 'bike', 'walking', 'public_transport']),
    average_speed_kmh: z.number().optional(),
    fuel_efficiency: z.number().optional(),
    capacity: z.number().optional()
  }),
  constraints: z.object({
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
    start_location: z.string().optional(),
    end_location: z.string().optional(),
    max_travel_time_minutes: z.number().optional(),
    max_total_distance_km: z.number().optional(),
    break_duration_minutes: z.number().optional(),
    break_after_hours: z.number().optional()
  }),
  date: z.string().optional()
});

export const LocationFinderArgsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  location: z.string().min(1, 'Center location is required'),
  radius: z.number().optional().default(5000),
  limit: z.number().optional().default(10),
  types: z.string().optional(),
  include_details: z.boolean().optional().default(true)
});

export const RouteOptimizerArgsSchema = z.object({
  locations: z.array(z.object({
    name: z.string().min(1, 'Location name is required'),
    coordinates: z.string().min(1, 'Coordinates are required'),
    priority: z.enum(['high', 'medium', 'low']).optional().default('medium')
  })).min(2, 'At least two locations are required for optimization'),
  start_location: z.string().optional(),
  end_location: z.string().optional(),
  vehicle_type: z.enum(['car', 'bike', 'walking']).optional().default('car'),
  optimization_goal: z.enum(['time', 'distance', 'balanced']).optional().default('time')
});

export type AutocompleteArgs = z.infer<typeof AutocompleteArgsSchema>;
export type PlaceDetailsArgs = z.infer<typeof PlaceDetailsArgsSchema>;
export type NearbySearchArgs = z.infer<typeof NearbySearchArgsSchema>;
export type TextSearchArgs = z.infer<typeof TextSearchArgsSchema>;
export type AddressValidationArgs = z.infer<typeof AddressValidationArgsSchema>;
export type GeocodeArgs = z.infer<typeof GeocodeArgsSchema>;
export type ReverseGeocodeArgs = z.infer<typeof ReverseGeocodeArgsSchema>;
export type DistanceMatrixArgs = z.infer<typeof DistanceMatrixArgsSchema>;
export type SnapToRoadArgs = z.infer<typeof SnapToRoadArgsSchema>;
export type NearestRoadsArgs = z.infer<typeof NearestRoadsArgsSchema>;
export type SpeedLimitsArgs = z.infer<typeof SpeedLimitsArgsSchema>;
export type ElevationArgs = z.infer<typeof ElevationArgsSchema>;
export type MultipleElevationArgs = z.infer<typeof MultipleElevationArgsSchema>;
export type StyleConfigArgs = z.infer<typeof StyleConfigArgsSchema>;
export type TripPlannerArgs = z.infer<typeof TripPlannerArgsSchema>;
export type LocationFinderArgs = z.infer<typeof LocationFinderArgsSchema>;
export const DirectionsArgsSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  waypoints: z.array(z.string()).optional(),
  mode: z.string().optional().default('driving'),
  alternatives: z.boolean().optional().default(false),
  avoid: z.string().optional(),
  units: z.string().optional().default('metric')
});

export const PhotoArgsSchema = z.object({
  photo_reference: z.string().min(1, 'Photo reference is required'),
  maxWidth: z.number().optional(),
  maxHeight: z.number().optional()
});

export const SearchAlongRouteArgsSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  query: z.string().min(1, 'Search query is required'),
  radius: z.number().optional(),
  types: z.string().optional()
});

export const RouteOptimizerAdvancedArgsSchema = z.object({
  locations: z.array(z.string()).min(2, 'At least two locations are required'),
  roundTrip: z.boolean().optional().default(false),
  mode: z.string().optional().default('driving'),
  startLocation: z.string().optional(),
  endLocation: z.string().optional()
});

export const ShowMapHtmlArgsSchema = z.object({
  route_polyline: z.string().min(1, 'Route polyline is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  waypoints: z.array(z.string()).optional(),
  zoom: z.number().optional().default(12),
  width: z.number().optional().default(800),
  height: z.number().optional().default(600)
});

export const ShowMarkersMapHtmlArgsSchema = z.object({
  markers: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    title: z.string(),
    description: z.string().optional()
  })).min(1, 'At least one marker is required'),
  center: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  zoom: z.number().optional().default(12),
  width: z.number().optional().default(800),
  height: z.number().optional().default(600),
  showRoute: z.boolean().optional().default(false)
});

export const ShowActualRouteMapArgsSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  waypoints: z.array(z.string()).optional(),
  mode: z.string().optional().default('driving'),
  zoom: z.number().optional().default(12),
  width: z.number().optional().default(800),
  height: z.number().optional().default(600)
});

export const SequentialRouteMapArgsSchema = z.object({
  points: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string()
  })).min(2, 'At least 2 points are required'),
  mode: z.string().optional().default('driving'),
  optimize: z.boolean().optional().default(true),
  zoom: z.number().optional().default(12),
  width: z.number().optional().default(900),
  height: z.number().optional().default(700)
});

export type DirectionsArgs = z.infer<typeof DirectionsArgsSchema>;
export type PhotoArgs = z.infer<typeof PhotoArgsSchema>;
export type SearchAlongRouteArgs = z.infer<typeof SearchAlongRouteArgsSchema>;
export type RouteOptimizerAdvancedArgs = z.infer<typeof RouteOptimizerAdvancedArgsSchema>;
export type ShowMapHtmlArgs = z.infer<typeof ShowMapHtmlArgsSchema>;
export type ShowMarkersMapHtmlArgs = z.infer<typeof ShowMarkersMapHtmlArgsSchema>;
export type ShowActualRouteMapArgs = z.infer<typeof ShowActualRouteMapArgsSchema>;
export type SequentialRouteMapArgs = z.infer<typeof SequentialRouteMapArgsSchema>;
export type RouteOptimizerArgs = z.infer<typeof RouteOptimizerArgsSchema>;