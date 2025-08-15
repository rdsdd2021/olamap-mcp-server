/**
 * Tests for OlaMapClient
 */

import { OlaMapClient } from '../olamap-client.js';

// Mock fetch
global.fetch = jest.fn();

describe('OlaMapClient', () => {
  let client: OlaMapClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new OlaMapClient(mockApiKey);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(client).toBeInstanceOf(OlaMapClient);
    });

    it('should initialize with custom options', () => {
      const customClient = new OlaMapClient(mockApiKey, {
        baseUrl: 'https://custom.api.com',
        timeout: 5000
      });
      expect(customClient).toBeInstanceOf(OlaMapClient);
    });
  });

  describe('autocomplete', () => {
    it('should make correct API call for autocomplete', async () => {
      const mockResponse = {
        predictions: [
          {
            description: 'Test Place',
            place_id: 'test-id',
            structured_formatting: {
              main_text: 'Test',
              secondary_text: 'Place'
            }
          }
        ],
        status: 'OK'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.autocomplete('test query');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/places/v1/autocomplete'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should include optional parameters', async () => {
      const mockResponse = { predictions: [], status: 'OK' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await client.autocomplete('test', '12.9316,77.6164', {
        radius: '1000',
        types: 'restaurant'
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('location=12.9316%2C77.6164');
      expect(callUrl).toContain('radius=1000');
      expect(callUrl).toContain('types=restaurant');
    });
  });

  describe('getPlaceDetails', () => {
    it('should make correct API call for basic place details', async () => {
      const mockResponse = {
        result: {
          place_id: 'test-id',
          name: 'Test Place',
          formatted_address: 'Test Address'
        },
        status: 'OK'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.getPlaceDetails('test-place-id');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/places/v1/details'),
        expect.any(Object)
      );

      expect(result).toEqual(mockResponse);
    });

    it('should use advanced endpoint when requested', async () => {
      const mockResponse = { result: {}, status: 'OK' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await client.getPlaceDetails('test-place-id', true);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/places/v1/details/advanced');
    });
  });

  describe('validateAddress', () => {
    it('should make correct API call for address validation', async () => {
      const mockResponse = {
        result: {
          validated: true,
          validated_address: 'Validated Address'
        },
        status: 'validation_done'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.validateAddress('Test Address');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/places/v1/addressvalidation'),
        expect.any(Object)
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getElevation', () => {
    it('should make correct API call for single elevation', async () => {
      const mockResponse = {
        results: [
          {
            elevation: 908,
            location: { lat: 12.9316, lng: 77.6164 }
          }
        ],
        status: 'ok'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.getElevation(12.9316, 77.6164);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('location=12.9316%2C77.6164');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMultipleElevations', () => {
    it('should make correct POST API call for multiple elevations', async () => {
      const mockResponse = {
        results: [
          { elevation: 908, location: { lat: '12.9316', lng: '77.6164' } }
        ],
        status: 'ok'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const coordinates = ['12.9316,77.6164', '12.935,77.620'];
      const result = await client.getMultipleElevations(coordinates);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/places/v1/elevation'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ locations: coordinates })
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(client.autocomplete('test')).rejects.toThrow(
        'OlaMap API request failed: HTTP 400: Bad Request'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(client.autocomplete('test')).rejects.toThrow(
        'OlaMap API request failed: Network error'
      );
    });
  });
});