const { 
  AIRPORTS, 
  COUNTRIES, 
  AIRPORT_NAMES, 
  getAirportName, 
  generateGate, 
  getDepartureStatus, 
  getArrivalStatus 
} = require('../server');

describe('Data Validation Tests', () => {
  
  describe('Airport and Country data integrity', () => {
    it('All airports in COUNTRIES.airports arrays exist in AIRPORTS object', () => {
      COUNTRIES.forEach(country => {
        country.airports.forEach(airportCode => {
          expect(AIRPORTS).toHaveProperty(airportCode);
        });
      });
    });

    it('All airport objects have required fields', () => {
      Object.values(AIRPORTS).forEach(airport => {
        expect(airport).toHaveProperty('name');
        expect(airport).toHaveProperty('code');
        expect(airport).toHaveProperty('icao');
        expect(airport).toHaveProperty('country');
        expect(airport).toHaveProperty('lat');
        expect(airport).toHaveProperty('lon');
        expect(airport).toHaveProperty('bbox');

        // Type checks
        expect(typeof airport.name).toBe('string');
        expect(typeof airport.code).toBe('string');
        expect(typeof airport.icao).toBe('string');
        expect(typeof airport.country).toBe('string');
        expect(typeof airport.lat).toBe('number');
        expect(typeof airport.lon).toBe('number');
        expect(typeof airport.bbox).toBe('object');
      });
    });

    it('All bbox objects have lamin, lomin, lamax, lomax', () => {
      Object.values(AIRPORTS).forEach(airport => {
        expect(airport.bbox).toHaveProperty('lamin');
        expect(airport.bbox).toHaveProperty('lomin');
        expect(airport.bbox).toHaveProperty('lamax');
        expect(airport.bbox).toHaveProperty('lomax');

        // Type checks
        expect(typeof airport.bbox.lamin).toBe('number');
        expect(typeof airport.bbox.lomin).toBe('number');
        expect(typeof airport.bbox.lamax).toBe('number');
        expect(typeof airport.bbox.lomax).toBe('number');
      });
    });

    it('All ICAO codes in AIRPORT_NAMES are uppercase and 4 characters', () => {
      Object.keys(AIRPORT_NAMES).forEach(icao => {
        expect(icao).toMatch(/^[A-Z]{4}$/);
        expect(icao).toBe(icao.toUpperCase());
        expect(icao.length).toBe(4);
      });
    });
  });

  describe('getAirportName function', () => {
    it('getAirportName("ENGM") returns "OSLO GARDERMOEN"', () => {
      expect(getAirportName('ENGM')).toBe('OSLO GARDERMOEN');
    });

    it('getAirportName(null) returns "UNKNOWN"', () => {
      expect(getAirportName(null)).toBe('UNKNOWN');
    });

    it('getAirportName(undefined) returns "UNKNOWN"', () => {
      expect(getAirportName(undefined)).toBe('UNKNOWN');
    });

    it('getAirportName("XXXX") returns "XXXX" (unknown codes returned as-is)', () => {
      expect(getAirportName('XXXX')).toBe('XXXX');
    });

    it('getAirportName("") returns "UNKNOWN"', () => {
      expect(getAirportName('')).toBe('UNKNOWN');
    });

    it('getAirportName with non-string returns "UNKNOWN"', () => {
      expect(getAirportName(123)).toBe('UNKNOWN');
      expect(getAirportName({})).toBe('UNKNOWN');
      expect(getAirportName([])).toBe('UNKNOWN');
    });

    it('getAirportName handles lowercase ICAO codes', () => {
      expect(getAirportName('engm')).toBe('OSLO GARDERMOEN');
      expect(getAirportName('essa')).toBe('STOCKHOLM ARLANDA');
    });
  });

  describe('generateGate function', () => {
    it('generateGate returns valid gate pattern', () => {
      const gatePattern = /^[A-D]\d{2}$/;
      
      // Test multiple times to ensure randomness doesn't break pattern
      for (let i = 0; i < 20; i++) {
        const gate = generateGate();
        expect(gatePattern.test(gate)).toBe(true);
      }
    });

    it('generateGate returns string with length 3', () => {
      for (let i = 0; i < 10; i++) {
        const gate = generateGate();
        expect(gate.length).toBe(3);
      }
    });

    it('generateGate terminal is one of A, B, C, D', () => {
      const validTerminals = ['A', 'B', 'C', 'D'];
      
      for (let i = 0; i < 20; i++) {
        const gate = generateGate();
        const terminal = gate[0];
        expect(validTerminals).toContain(terminal);
      }
    });

    it('generateGate gate number is zero-padded 2 digits', () => {
      for (let i = 0; i < 20; i++) {
        const gate = generateGate();
        const gateNumber = gate.substring(1);
        expect(gateNumber).toMatch(/^\d{2}$/);
      }
    });
  });

  describe('getDepartureStatus function', () => {
    it('getDepartureStatus returns valid statuses based on time', () => {
      const now = Math.floor(Date.now() / 1000);
      const validStatuses = ['Departed', 'Boarding', 'Scheduled'];
      
      // Test various time scenarios
      const scenarios = [
        { firstSeen: now - 2000, lastSeen: now - 1500 }, // Should be Departed
        { firstSeen: now - 1000, lastSeen: now - 500 },  // Should be Boarding
        { firstSeen: now + 500, lastSeen: now + 1000 },  // Should be Scheduled
        { firstSeen: now - 300, lastSeen: now },         // Should be Scheduled
      ];

      scenarios.forEach(scenario => {
        const status = getDepartureStatus(scenario.firstSeen, scenario.lastSeen);
        expect(validStatuses).toContain(status);
      });
    });

    it('getDepartureStatus returns "Departed" for old flights (> 30 min ago)', () => {
      const now = Math.floor(Date.now() / 1000);
      const firstSeen = now - 1900; // 31+ minutes ago
      const status = getDepartureStatus(firstSeen, now);
      expect(status).toBe('Departed');
    });

    it('getDepartureStatus returns "Boarding" for recent departures (10-30 min ago)', () => {
      const now = Math.floor(Date.now() / 1000);
      const firstSeen = now - 1200; // 20 minutes ago
      const status = getDepartureStatus(firstSeen, now);
      expect(status).toBe('Boarding');
    });

    it('getDepartureStatus returns "Scheduled" for upcoming flights (< 10 min)', () => {
      const now = Math.floor(Date.now() / 1000);
      const firstSeen = now + 300; // 5 minutes from now
      const status = getDepartureStatus(firstSeen, now);
      expect(status).toBe('Scheduled');
    });
  });

  describe('getArrivalStatus function', () => {
    it('getArrivalStatus returns valid statuses based on time', () => {
      const now = Math.floor(Date.now() / 1000);
      const validStatuses = ['Landed', 'On Approach', 'Expected'];
      
      // Test various time scenarios
      const scenarios = [
        { firstSeen: now - 7200, lastSeen: now - 4000 }, // Should be Landed
        { firstSeen: now - 3600, lastSeen: now - 1000 }, // Should be On Approach
        { firstSeen: now - 1000, lastSeen: now + 2000 }, // Should be Expected
      ];

      scenarios.forEach(scenario => {
        const status = getArrivalStatus(scenario.firstSeen, scenario.lastSeen);
        expect(validStatuses).toContain(status);
      });
    });

    it('getArrivalStatus returns "Landed" for flights that arrived > 1 hour ago', () => {
      const now = Math.floor(Date.now() / 1000);
      const lastSeen = now - 3700; // More than 1 hour ago
      const status = getArrivalStatus(now - 7200, lastSeen);
      expect(status).toBe('Landed');
    });

    it('getArrivalStatus returns "On Approach" for flights arriving soon (< 30 min)', () => {
      const now = Math.floor(Date.now() / 1000);
      const lastSeen = now + 1000; // 16 minutes from now
      const status = getArrivalStatus(now - 3600, lastSeen);
      expect(status).toBe('On Approach');
    });

    it('getArrivalStatus returns "Expected" for flights arriving later (> 30 min)', () => {
      const now = Math.floor(Date.now() / 1000);
      const lastSeen = now + 2000; // 33+ minutes from now
      const status = getArrivalStatus(now - 1000, lastSeen);
      expect(status).toBe('Expected');
    });
  });

  describe('ICAO mapping consistency', () => {
    it('All airports in AIRPORTS have their ICAO codes defined in AIRPORT_NAMES', () => {
      Object.values(AIRPORTS).forEach(airport => {
        expect(AIRPORT_NAMES).toHaveProperty(airport.icao);
      });
    });

    it('ICAO to name mapping is correct for main airports', () => {
      expect(AIRPORT_NAMES['ENGM']).toBe('OSLO GARDERMOEN');
      expect(AIRPORT_NAMES['ENBR']).toBe('BERGEN FLESLAND');
      expect(AIRPORT_NAMES['ESSA']).toBe('STOCKHOLM ARLANDA');
      expect(AIRPORT_NAMES['EKCH']).toBe('COPENHAGEN');
      expect(AIRPORT_NAMES['EFHK']).toBe('HELSINKI VANTAA');
    });
  });
});
