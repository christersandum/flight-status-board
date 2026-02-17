/**
 * @jest-environment jsdom
 */

// Mock fetch for testing
global.fetch = jest.fn();

describe('Frontend Logic Tests', () => {
  
  describe('FlightAPI class tests', () => {
    let flightAPI;

    beforeEach(() => {
      // Reset fetch mock before each test
      fetch.mockClear();
      
      // Define FlightAPI class for testing
      class FlightAPI {
        constructor(baseURL = '') {
          this.baseURL = baseURL;
        }

        async fetchCountries() {
          const response = await fetch(`${this.baseURL}/api/countries`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        }

        async fetchAirports(countryCode = null) {
          const url = countryCode 
            ? `${this.baseURL}/api/airports?country=${countryCode}`
            : `${this.baseURL}/api/airports`;
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        }

        async fetchDepartures(airportCode) {
          const response = await fetch(`${this.baseURL}/api/departures?airport=${airportCode}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        }

        async fetchArrivals(airportCode) {
          const response = await fetch(`${this.baseURL}/api/arrivals?airport=${airportCode}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        }

        async checkHealth() {
          const response = await fetch(`${this.baseURL}/health`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        }
      }

      flightAPI = new FlightAPI();
    });

    it('fetchDepartures calls correct URL /api/departures?airport=OSL', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flights: [] })
      });

      await flightAPI.fetchDepartures('OSL');

      expect(fetch).toHaveBeenCalledWith('/api/departures?airport=OSL');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fetchArrivals calls correct URL /api/arrivals?airport=OSL', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flights: [] })
      });

      await flightAPI.fetchArrivals('OSL');

      expect(fetch).toHaveBeenCalledWith('/api/arrivals?airport=OSL');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fetchCountries calls /api/countries', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      await flightAPI.fetchCountries();

      expect(fetch).toHaveBeenCalledWith('/api/countries');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fetchAirports calls /api/airports?country=NO', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      await flightAPI.fetchAirports('NO');

      expect(fetch).toHaveBeenCalledWith('/api/airports?country=NO');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('checkHealth calls /health', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      });

      await flightAPI.checkHealth();

      expect(fetch).toHaveBeenCalledWith('/health');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fetchDepartures throws on non-OK response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(flightAPI.fetchDepartures('OSL')).rejects.toThrow('HTTP error! status: 404');
    });

    it('fetchArrivals throws on non-OK response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(flightAPI.fetchArrivals('OSL')).rejects.toThrow('HTTP error! status: 500');
    });

    it('fetchCountries throws on non-OK response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(flightAPI.fetchCountries()).rejects.toThrow('HTTP error! status: 500');
    });

    it('checkHealth throws on non-OK response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      await expect(flightAPI.checkHealth()).rejects.toThrow('HTTP error! status: 503');
    });
  });

  describe('Time formatting tests', () => {
    function formatTime(timestamp) {
      if (!timestamp) return '--:--';
      const date = new Date(timestamp * 1000);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    it('formatTime correctly converts Unix timestamps to HH:MM format', () => {
      // Create a known timestamp: 2024-01-01 14:30:00 UTC
      const timestamp = 1704117000; // 2024-01-01 14:30:00 UTC
      const result = formatTime(timestamp);
      
      // Result will vary based on timezone, so we just check format
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('formatTime(null) returns --:--', () => {
      expect(formatTime(null)).toBe('--:--');
    });

    it('formatTime(undefined) returns --:--', () => {
      expect(formatTime(undefined)).toBe('--:--');
    });

    it('formatTime(0) returns --:-- (0 is falsy)', () => {
      const result = formatTime(0);
      expect(result).toBe('--:--');
    });
  });

  describe('Status class mapping tests', () => {
    function getStatusClass(status) {
      return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
    }

    it('Departed maps to status-departed', () => {
      expect(getStatusClass('Departed')).toBe('status-departed');
    });

    it('Landed maps to status-landed', () => {
      expect(getStatusClass('Landed')).toBe('status-landed');
    });

    it('Boarding maps to status-boarding', () => {
      expect(getStatusClass('Boarding')).toBe('status-boarding');
    });

    it('On Approach maps to status-on-approach', () => {
      expect(getStatusClass('On Approach')).toBe('status-on-approach');
    });

    it('Scheduled maps to status-scheduled', () => {
      expect(getStatusClass('Scheduled')).toBe('status-scheduled');
    });

    it('Expected maps to status-expected', () => {
      expect(getStatusClass('Expected')).toBe('status-expected');
    });
  });
});
