/**
 * Tests for AdvancedRoutePlanner
 */

import { AdvancedRoutePlanner, VisitLocation, Vehicle, TripConstraints } from '../route-planner.js';
import { OlaMapClient } from '../olamap-client.js';

// Mock OlaMapClient
jest.mock('../olamap-client.js');

describe('AdvancedRoutePlanner', () => {
  let routePlanner: AdvancedRoutePlanner;
  let mockOlaMapClient: jest.Mocked<OlaMapClient>;

  beforeEach(() => {
    mockOlaMapClient = new OlaMapClient('test-key') as jest.Mocked<OlaMapClient>;
    routePlanner = new AdvancedRoutePlanner(mockOlaMapClient);
  });

  describe('planTrip', () => {
    const mockLocations: VisitLocation[] = [
      {
        name: 'School A',
        address: 'Koramangala, Bengaluru, Karnataka 560034, India',
        visit_duration_minutes: 30,
        priority: 'high'
      },
      {
        name: 'School B', 
        coordinates: '12.935,77.620',
        visit_duration_minutes: 30,
        priority: 'medium'
      },
      {
        name: 'School C',
        coordinates: '12.940,77.625',
        visit_duration_minutes: 30,
        priority: 'low'
      }
    ];

    const mockVehicle: Vehicle = {
      type: 'car',
      average_speed_kmh: 40
    };

    const mockConstraints: TripConstraints = {
      start_time: '09:00',
      end_time: '17:00'
    };

    beforeEach(() => {
      // Mock geocoding response
      mockOlaMapClient.geocode.mockResolvedValue({
        geocodingResults: [{
          geometry: {
            location: { lat: 12.931, lng: 77.616 },
            location_type: 'ROOFTOP'
          },
          formatted_address: 'Koramangala, Bengaluru',
          address_components: [],
          place_id: 'test-place-id',
          types: ['locality']
        }],
        status: 'OK'
      });

      // Mock distance matrix response
      mockOlaMapClient.getDistanceMatrix.mockResolvedValue({
        rows: [
          {
            elements: [
              { distance: 0, duration: 0, status: 'OK' },
              { distance: 1000, duration: 600, status: 'OK' }, // 10 minutes
              { distance: 2000, duration: 900, status: 'OK' }  // 15 minutes
            ]
          },
          {
            elements: [
              { distance: 1000, duration: 600, status: 'OK' },
              { distance: 0, duration: 0, status: 'OK' },
              { distance: 1500, duration: 720, status: 'OK' }  // 12 minutes
            ]
          },
          {
            elements: [
              { distance: 2000, duration: 900, status: 'OK' },
              { distance: 1500, duration: 720, status: 'OK' },
              { distance: 0, duration: 0, status: 'OK' }
            ]
          }
        ],
        status: 'OK'
      });
    });

    it('should create a feasible single-day plan for reasonable locations', async () => {
      const result = await routePlanner.planTrip(mockLocations, mockVehicle, mockConstraints);

      expect(result.feasible_in_single_day).toBe(true);
      expect(result.recommended_days).toBe(1);
      expect(result.day_plans).toHaveLength(1);
      
      const dayPlan = result.day_plans[0];
      expect(dayPlan.feasible).toBe(true);
      expect(dayPlan.locations).toHaveLength(3);
      expect(dayPlan.total_visit_time_minutes).toBe(90); // 3 * 30 minutes
    });

    it('should prioritize high-priority locations first', async () => {
      const result = await routePlanner.planTrip(mockLocations, mockVehicle, mockConstraints);
      
      const dayPlan = result.day_plans[0];
      expect(dayPlan.locations[0].name).toBe('School A'); // High priority should be first
    });

    it('should split into multiple days when time constraints are tight', async () => {
      const tightConstraints: TripConstraints = {
        start_time: '09:00',
        end_time: '10:30' // Only 1.5 hours available
      };

      const result = await routePlanner.planTrip(mockLocations, mockVehicle, tightConstraints);

      expect(result.feasible_in_single_day).toBe(false);
      expect(result.recommended_days).toBeGreaterThan(1);
    });

    it('should handle locations that cannot be resolved', async () => {
      const locationsWithBadAddress: VisitLocation[] = [
        {
          name: 'Invalid Location',
          address: 'Non-existent address',
          visit_duration_minutes: 30
        }
      ];

      mockOlaMapClient.geocode.mockResolvedValue({
        geocodingResults: [],
        status: 'ZERO_RESULTS'
      });

      await expect(
        routePlanner.planTrip(locationsWithBadAddress, mockVehicle, mockConstraints)
      ).rejects.toThrow('Could not resolve coordinates');
    });

    it('should provide optimization notes and suggestions', async () => {
      const result = await routePlanner.planTrip(mockLocations, mockVehicle, mockConstraints);

      expect(result.optimization_notes).toBeDefined();
      expect(result.alternative_suggestions).toBeDefined();
    });

    it('should calculate total distance and time correctly', async () => {
      const result = await routePlanner.planTrip(mockLocations, mockVehicle, mockConstraints);

      expect(result.total_distance_km).toBeGreaterThan(0);
      expect(result.total_time_hours).toBeGreaterThan(0);
      
      const dayPlan = result.day_plans[0];
      expect(dayPlan.total_travel_time_minutes).toBeGreaterThan(0);
      expect(dayPlan.total_visit_time_minutes).toBe(90);
    });
  });

  describe('utility methods', () => {
    it('should parse and format time correctly', async () => {
      // Test through the planning process which uses these methods
      const locations: VisitLocation[] = [{
        name: 'Test Location',
        coordinates: '12.931,77.616',
        visit_duration_minutes: 60
      }];

      mockOlaMapClient.getDistanceMatrix.mockResolvedValue({
        rows: [{ elements: [{ distance: 0, duration: 0, status: 'OK' }] }],
        status: 'OK'
      });

      const result = await routePlanner.planTrip(locations, mockVehicle, mockConstraints);
      
      expect(result.day_plans[0].start_time).toBe('09:00');
      expect(result.day_plans[0].end_time).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});