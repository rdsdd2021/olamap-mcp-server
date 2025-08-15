/**
 * Advanced Route Planning and Optimization
 * 
 * Handles complex multi-location visits with time constraints,
 * vehicle considerations, and intelligent scheduling
 */

import { OlaMapClient } from './olamap-client.js';
import { Location, DistanceMatrixElement } from './types.js';

export interface VisitLocation {
  name: string;
  address?: string;
  coordinates?: string; // "lat,lng"
  place_id?: string;
  visit_duration_minutes: number;
  preferred_time?: string; // "HH:MM" format
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface Vehicle {
  type: 'car' | 'bike' | 'walking' | 'public_transport';
  average_speed_kmh?: number;
  fuel_efficiency?: number;
  capacity?: number;
}

export interface TripConstraints {
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  start_location?: string; // "lat,lng" or address
  end_location?: string; // "lat,lng" or address (if different from start)
  max_travel_time_minutes?: number;
  max_total_distance_km?: number;
  break_duration_minutes?: number; // lunch break, etc.
  break_after_hours?: number; // take break after X hours
}

export interface RouteSegment {
  from: VisitLocation;
  to: VisitLocation;
  distance_km: number;
  travel_time_minutes: number;
  departure_time: string;
  arrival_time: string;
  polyline?: string;
}

export interface DayPlan {
  day: number;
  date?: string;
  locations: VisitLocation[];
  route_segments: RouteSegment[];
  total_distance_km: number;
  total_travel_time_minutes: number;
  total_visit_time_minutes: number;
  start_time: string;
  end_time: string;
  feasible: boolean;
  issues?: string[];
  suggestions?: string[];
}

export interface TripPlan {
  feasible_in_single_day: boolean;
  recommended_days: number;
  day_plans: DayPlan[];
  total_distance_km: number;
  total_time_hours: number;
  unvisited_locations: VisitLocation[];
  optimization_notes: string[];
  alternative_suggestions: string[];
}

export class AdvancedRoutePlanner {
  private olaMapClient: OlaMapClient;

  constructor(olaMapClient: OlaMapClient) {
    this.olaMapClient = olaMapClient;
  }

  async planTrip(
    locations: VisitLocation[],
    vehicle: Vehicle,
    constraints: TripConstraints,
    date?: string
  ): Promise<TripPlan> {
    try {
      // Step 1: Resolve all locations to coordinates
      const resolvedLocations = await this.resolveLocations(locations);
      
      // Step 2: Get distance matrix between all locations
      const distanceMatrix = await this.getDistanceMatrix(resolvedLocations, vehicle);
      
      // Step 3: Optimize route order
      const optimizedOrder = this.optimizeRoute(resolvedLocations, distanceMatrix, constraints);
      
      // Step 4: Calculate time schedule
      const schedule = this.calculateSchedule(optimizedOrder, distanceMatrix, constraints);
      
      // Step 5: Check feasibility and create day plans
      const dayPlans = this.createDayPlans(schedule, constraints, date);
      
      // Step 6: Generate final trip plan
      return this.generateTripPlan(dayPlans, resolvedLocations, constraints);
      
    } catch (error) {
      throw new Error(`Route planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async resolveLocations(locations: VisitLocation[]): Promise<VisitLocation[]> {
    const resolved: VisitLocation[] = [];
    
    for (const location of locations) {
      let coordinates = location.coordinates;
      
      if (!coordinates && location.address) {
        // Geocode the address
        try {
          const geocodeResult = await this.olaMapClient.geocode(location.address);
          if (geocodeResult.geocodingResults && geocodeResult.geocodingResults.length > 0) {
            const result = geocodeResult.geocodingResults[0];
            coordinates = `${result.geometry.location.lat},${result.geometry.location.lng}`;
          }
        } catch (error) {
          console.warn(`Failed to geocode address: ${location.address}`);
        }
      }
      
      if (!coordinates && location.place_id) {
        // Get coordinates from place details
        try {
          const placeDetails = await this.olaMapClient.getPlaceDetails(location.place_id);
          if (placeDetails.result && placeDetails.result.geometry) {
            const loc = placeDetails.result.geometry.location;
            coordinates = `${loc.lat},${loc.lng}`;
          }
        } catch (error) {
          console.warn(`Failed to get place details for: ${location.place_id}`);
        }
      }
      
      if (!coordinates) {
        throw new Error(`Could not resolve coordinates for location: ${location.name}`);
      }
      
      resolved.push({
        ...location,
        coordinates
      });
    }
    
    return resolved;
  }

  private async getDistanceMatrix(
    locations: VisitLocation[],
    vehicle: Vehicle
  ): Promise<number[][]> {
    const coordinates = locations.map(loc => loc.coordinates!);
    const mode = this.getRouteMode(vehicle.type);
    
    try {
      const result = await this.olaMapClient.getDistanceMatrix(
        coordinates,
        coordinates,
        mode
      );
      
      const matrix: number[][] = [];
      
      if (result.rows) {
        for (let i = 0; i < result.rows.length; i++) {
          matrix[i] = [];
          for (let j = 0; j < result.rows[i].elements.length; j++) {
            const element = result.rows[i].elements[j];
            // Convert duration from seconds to minutes
            matrix[i][j] = element.duration ? Math.ceil(element.duration / 60) : 999999;
          }
        }
      }
      
      return matrix;
    } catch (error) {
      // Fallback: estimate travel times based on straight-line distance
      return this.estimateDistanceMatrix(locations, vehicle);
    }
  }

  private estimateDistanceMatrix(locations: VisitLocation[], vehicle: Vehicle): number[][] {
    const matrix: number[][] = [];
    const avgSpeed = vehicle.average_speed_kmh || this.getDefaultSpeed(vehicle.type);
    
    for (let i = 0; i < locations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          const [lat1, lng1] = locations[i].coordinates!.split(',').map(Number);
          const [lat2, lng2] = locations[j].coordinates!.split(',').map(Number);
          
          const distance = this.calculateHaversineDistance(lat1, lng1, lat2, lng2);
          const timeMinutes = Math.ceil((distance / avgSpeed) * 60);
          matrix[i][j] = timeMinutes;
        }
      }
    }
    
    return matrix;
  }

  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private optimizeRoute(
    locations: VisitLocation[],
    distanceMatrix: number[][],
    constraints: TripConstraints
  ): VisitLocation[] {
    // Simple nearest neighbor optimization with priority consideration
    const unvisited = [...locations];
    const optimized: VisitLocation[] = [];
    
    // Sort by priority first
    unvisited.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return bPriority - aPriority;
    });
    
    // Start with highest priority location
    let currentIndex = 0;
    optimized.push(unvisited.splice(currentIndex, 1)[0]);
    
    // Find nearest unvisited location considering priority
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let shortestTime = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const originalIndex = locations.indexOf(unvisited[i]);
        const currentOriginalIndex = locations.indexOf(optimized[optimized.length - 1]);
        const travelTime = distanceMatrix[currentOriginalIndex][originalIndex];
        
        // Apply priority bonus (reduce effective travel time for high priority)
        const priorityBonus = unvisited[i].priority === 'high' ? 0.8 : 
                             unvisited[i].priority === 'medium' ? 0.9 : 1.0;
        const effectiveTime = travelTime * priorityBonus;
        
        if (effectiveTime < shortestTime) {
          shortestTime = effectiveTime;
          nearestIndex = i;
        }
      }
      
      optimized.push(unvisited.splice(nearestIndex, 1)[0]);
    }
    
    return optimized;
  }

  private calculateSchedule(
    locations: VisitLocation[],
    distanceMatrix: number[][],
    constraints: TripConstraints
  ): Array<{ location: VisitLocation; arrival: string; departure: string; travel_time: number }> {
    const schedule: Array<{ location: VisitLocation; arrival: string; departure: string; travel_time: number }> = [];
    let currentTime = this.parseTime(constraints.start_time);
    
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      let travelTime = 0;
      
      if (i > 0) {
        const prevLocationIndex = locations.indexOf(locations[i - 1]);
        const currentLocationIndex = locations.indexOf(location);
        travelTime = distanceMatrix[prevLocationIndex][currentLocationIndex];
        currentTime += travelTime;
      }
      
      const arrival = this.formatTime(currentTime);
      const departure = this.formatTime(currentTime + location.visit_duration_minutes);
      
      schedule.push({
        location,
        arrival,
        departure,
        travel_time: travelTime
      });
      
      currentTime += location.visit_duration_minutes;
    }
    
    return schedule;
  }

  private createDayPlans(
    schedule: Array<{ location: VisitLocation; arrival: string; departure: string; travel_time: number }>,
    constraints: TripConstraints,
    date?: string
  ): DayPlan[] {
    const dayPlans: DayPlan[] = [];
    const maxDayMinutes = this.parseTime(constraints.end_time) - this.parseTime(constraints.start_time);
    
    let currentDay = 1;
    let currentDayLocations: VisitLocation[] = [];
    let currentDaySegments: RouteSegment[] = [];
    let currentDayTime = 0;
    let currentDayDistance = 0;
    
    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];
      const totalTimeNeeded = item.travel_time + item.location.visit_duration_minutes;
      
      // Check if adding this location exceeds day limit
      if (currentDayTime + totalTimeNeeded > maxDayMinutes && currentDayLocations.length > 0) {
        // Finish current day
        dayPlans.push(this.createDayPlan(
          currentDay,
          currentDayLocations,
          currentDaySegments,
          currentDayDistance,
          currentDayTime,
          constraints,
          date
        ));
        
        // Start new day
        currentDay++;
        currentDayLocations = [];
        currentDaySegments = [];
        currentDayTime = 0;
        currentDayDistance = 0;
      }
      
      currentDayLocations.push(item.location);
      currentDayTime += totalTimeNeeded;
      
      // Add route segment if not first location of the day
      if (currentDayLocations.length > 1) {
        const prevLocation = currentDayLocations[currentDayLocations.length - 2];
        const segment: RouteSegment = {
          from: prevLocation,
          to: item.location,
          distance_km: this.estimateDistance(prevLocation, item.location),
          travel_time_minutes: item.travel_time,
          departure_time: schedule[i - 1].departure,
          arrival_time: item.arrival
        };
        currentDaySegments.push(segment);
        currentDayDistance += segment.distance_km;
      }
    }
    
    // Add final day if there are remaining locations
    if (currentDayLocations.length > 0) {
      dayPlans.push(this.createDayPlan(
        currentDay,
        currentDayLocations,
        currentDaySegments,
        currentDayDistance,
        currentDayTime,
        constraints,
        date
      ));
    }
    
    return dayPlans;
  }

  private createDayPlan(
    day: number,
    locations: VisitLocation[],
    segments: RouteSegment[],
    distance: number,
    time: number,
    constraints: TripConstraints,
    date?: string
  ): DayPlan {
    const maxDayMinutes = this.parseTime(constraints.end_time) - this.parseTime(constraints.start_time);
    const feasible = time <= maxDayMinutes;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (!feasible) {
      issues.push(`Day exceeds time limit by ${time - maxDayMinutes} minutes`);
      suggestions.push('Consider reducing visit durations or splitting into more days');
    }
    
    if (constraints.max_total_distance_km && distance > constraints.max_total_distance_km) {
      issues.push(`Day exceeds distance limit by ${(distance - constraints.max_total_distance_km).toFixed(1)} km`);
    }
    
    const totalVisitTime = locations.reduce((sum, loc) => sum + loc.visit_duration_minutes, 0);
    const totalTravelTime = time - totalVisitTime;
    
    return {
      day,
      date: date ? this.addDaysToDate(date, day - 1) : undefined,
      locations,
      route_segments: segments,
      total_distance_km: Math.round(distance * 10) / 10,
      total_travel_time_minutes: totalTravelTime,
      total_visit_time_minutes: totalVisitTime,
      start_time: constraints.start_time,
      end_time: this.formatTime(this.parseTime(constraints.start_time) + time),
      feasible,
      issues: issues.length > 0 ? issues : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  private generateTripPlan(
    dayPlans: DayPlan[],
    allLocations: VisitLocation[],
    constraints: TripConstraints
  ): TripPlan {
    const visitedLocations = dayPlans.flatMap(plan => plan.locations);
    const unvisitedLocations = allLocations.filter(loc => 
      !visitedLocations.some(visited => visited.name === loc.name)
    );
    
    const totalDistance = dayPlans.reduce((sum, plan) => sum + plan.total_distance_km, 0);
    const totalTime = dayPlans.reduce((sum, plan) => 
      sum + plan.total_travel_time_minutes + plan.total_visit_time_minutes, 0
    ) / 60;
    
    const feasibleInSingleDay = dayPlans.length === 1 && dayPlans[0].feasible;
    
    const optimizationNotes: string[] = [];
    const alternativeSuggestions: string[] = [];
    
    if (!feasibleInSingleDay) {
      optimizationNotes.push(`Trip requires ${dayPlans.length} days to complete comfortably`);
    }
    
    if (unvisitedLocations.length > 0) {
      optimizationNotes.push(`${unvisitedLocations.length} locations could not be scheduled`);
      alternativeSuggestions.push('Consider extending trip duration or reducing visit times');
    }
    
    // Add efficiency suggestions
    const avgTravelTime = dayPlans.reduce((sum, plan) => sum + plan.total_travel_time_minutes, 0) / dayPlans.length;
    if (avgTravelTime > 180) { // More than 3 hours travel per day
      alternativeSuggestions.push('Consider grouping locations by geographic proximity');
    }
    
    return {
      feasible_in_single_day: feasibleInSingleDay,
      recommended_days: dayPlans.length,
      day_plans: dayPlans,
      total_distance_km: Math.round(totalDistance * 10) / 10,
      total_time_hours: Math.round(totalTime * 10) / 10,
      unvisited_locations: unvisitedLocations,
      optimization_notes: optimizationNotes,
      alternative_suggestions: alternativeSuggestions
    };
  }

  // Utility methods
  private getRouteMode(vehicleType: string): string {
    switch (vehicleType) {
      case 'car': return 'driving';
      case 'bike': return 'cycling';
      case 'walking': return 'walking';
      case 'public_transport': return 'transit';
      default: return 'driving';
    }
  }

  private getDefaultSpeed(vehicleType: string): number {
    switch (vehicleType) {
      case 'car': return 40; // km/h in city
      case 'bike': return 15;
      case 'walking': return 5;
      case 'public_transport': return 25;
      default: return 40;
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private estimateDistance(loc1: VisitLocation, loc2: VisitLocation): number {
    if (!loc1.coordinates || !loc2.coordinates) return 0;
    
    const [lat1, lng1] = loc1.coordinates.split(',').map(Number);
    const [lat2, lng2] = loc2.coordinates.split(',').map(Number);
    
    return this.calculateHaversineDistance(lat1, lng1, lat2, lng2);
  }

  private addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}