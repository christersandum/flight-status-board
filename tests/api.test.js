const request = require('supertest');
const { app, AIRPORTS } = require('../server');

describe('Backend API Tests', () => {
  
  describe('Health endpoint', () => {
    it('GET /health returns 200 with status ok and valid timestamp', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verify timestamp is valid ISO format
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Countries endpoint', () => {
    it('GET /api/countries returns 200 with array of 4 countries', async () => {
      const response = await request(app).get('/api/countries');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4);
    });

    it('Each country has code, name, airports properties', async () => {
      const response = await request(app).get('/api/countries');
      
      response.body.forEach(country => {
        expect(country).toHaveProperty('code');
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('airports');
        expect(Array.isArray(country.airports)).toBe(true);
      });
    });

    it('Norway (NO) has airports OSL and BGO', async () => {
      const response = await request(app).get('/api/countries');
      
      const norway = response.body.find(c => c.code === 'NO');
      expect(norway).toBeDefined();
      expect(norway.name).toBe('Norway');
      expect(norway.airports).toEqual(['OSL', 'BGO']);
    });
  });

  describe('Airports endpoint', () => {
    it('GET /api/airports returns all 5 airports', async () => {
      const response = await request(app).get('/api/airports');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(5);
    });

    it('GET /api/airports?country=NO returns 2 airports (OSL, BGO)', async () => {
      const response = await request(app).get('/api/airports?country=NO');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      const codes = response.body.map(a => a.code);
      expect(codes).toContain('OSL');
      expect(codes).toContain('BGO');
    });

    it('GET /api/airports?country=SE returns 1 airport (ARN)', async () => {
      const response = await request(app).get('/api/airports?country=SE');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].code).toBe('ARN');
    });

    it('Each airport object has required fields', async () => {
      const response = await request(app).get('/api/airports');
      
      response.body.forEach(airport => {
        expect(airport).toHaveProperty('name');
        expect(airport).toHaveProperty('code');
        expect(airport).toHaveProperty('icao');
        expect(airport).toHaveProperty('country');
        expect(airport).toHaveProperty('lat');
        expect(airport).toHaveProperty('lon');
        expect(airport).toHaveProperty('bbox');
      });
    });

    it('Verify ICAO code mappings', async () => {
      const response = await request(app).get('/api/airports');
      
      const icaoMapping = {
        'OSL': 'ENGM',
        'ARN': 'ESSA',
        'CPH': 'EKCH',
        'HEL': 'EFHK',
        'BGO': 'ENBR'
      };

      response.body.forEach(airport => {
        expect(airport.icao).toBe(icaoMapping[airport.code]);
      });
    });
  });

  describe('Demo departures endpoint', () => {
    it('GET /api/departures/demo returns 200', async () => {
      const response = await request(app).get('/api/departures/demo');
      expect(response.status).toBe(200);
    });

    it('Response has airport, flights, count, timestamp', async () => {
      const response = await request(app).get('/api/departures/demo');
      
      expect(response.body).toHaveProperty('airport');
      expect(response.body).toHaveProperty('flights');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('Returns 8 mock flights', async () => {
      const response = await request(app).get('/api/departures/demo');
      
      expect(Array.isArray(response.body.flights)).toBe(true);
      expect(response.body.flights.length).toBe(8);
      expect(response.body.count).toBe(8);
    });

    it('Each flight has required fields', async () => {
      const response = await request(app).get('/api/departures/demo');
      
      response.body.flights.forEach(flight => {
        expect(flight).toHaveProperty('callsign');
        expect(flight).toHaveProperty('estDepartureAirport');
        expect(flight).toHaveProperty('estArrivalAirport');
        expect(flight).toHaveProperty('estArrivalAirportName');
        expect(flight).toHaveProperty('firstSeen');
        expect(flight).toHaveProperty('lastSeen');
        expect(flight).toHaveProperty('gate');
        expect(flight).toHaveProperty('status');
      });
    });

    it('Callsigns include expected flights', async () => {
      const response = await request(app).get('/api/departures/demo');
      
      const callsigns = response.body.flights.map(f => f.callsign);
      const expectedCallsigns = ['SK4455', 'DY622', 'LH867', 'KL1152', 'BA762', 'AF1268', 'AY681', 'SK1465'];
      
      expectedCallsigns.forEach(cs => {
        expect(callsigns).toContain(cs);
      });
    });

    it('Status values are valid departure statuses', async () => {
      const response = await request(app).get('/api/departures/demo');
      
      const validStatuses = ['Departed', 'Boarding', 'Scheduled'];
      
      response.body.flights.forEach(flight => {
        expect(validStatuses).toContain(flight.status);
      });
    });

    it('Airport names are resolved correctly', async () => {
      const response = await request(app).get('/api/departures/demo');
      
      const essaFlight = response.body.flights.find(f => f.estArrivalAirport === 'ESSA');
      expect(essaFlight.estArrivalAirportName).toBe('STOCKHOLM ARLANDA');
      
      const enbrFlight = response.body.flights.find(f => f.estArrivalAirport === 'ENBR');
      expect(enbrFlight.estArrivalAirportName).toBe('BERGEN FLESLAND');
    });

    it('Gates match pattern /^[A-D]\\d{2}$/', async () => {
      const response = await request(app).get('/api/departures/demo');
      
      const gatePattern = /^[A-D]\d{2}$/;
      
      response.body.flights.forEach(flight => {
        expect(gatePattern.test(flight.gate)).toBe(true);
      });
    });

    it('GET /api/departures/demo?airport=ARN works with Stockholm', async () => {
      const response = await request(app).get('/api/departures/demo?airport=ARN');
      
      expect(response.status).toBe(200);
      expect(response.body.airport.code).toBe('ARN');
      expect(response.body.flights.length).toBe(8);
    });
  });

  describe('Demo arrivals endpoint', () => {
    it('GET /api/arrivals/demo returns 200', async () => {
      const response = await request(app).get('/api/arrivals/demo');
      expect(response.status).toBe(200);
    });

    it('Returns 7 mock flights', async () => {
      const response = await request(app).get('/api/arrivals/demo');
      
      expect(Array.isArray(response.body.flights)).toBe(true);
      expect(response.body.flights.length).toBe(7);
      expect(response.body.count).toBe(7);
    });

    it('Each flight has required fields for arrivals', async () => {
      const response = await request(app).get('/api/arrivals/demo');
      
      response.body.flights.forEach(flight => {
        expect(flight).toHaveProperty('callsign');
        expect(flight).toHaveProperty('estDepartureAirport');
        expect(flight).toHaveProperty('estDepartureAirportName');
        expect(flight).toHaveProperty('estArrivalAirport');
        expect(flight).toHaveProperty('firstSeen');
        expect(flight).toHaveProperty('lastSeen');
        expect(flight).toHaveProperty('gate');
        expect(flight).toHaveProperty('status');
      });
    });

    it('Status values are valid arrival statuses', async () => {
      const response = await request(app).get('/api/arrivals/demo');
      
      const validStatuses = ['Landed', 'On Approach', 'Expected'];
      
      response.body.flights.forEach(flight => {
        expect(validStatuses).toContain(flight.status);
      });
    });
  });

  describe('Error handling', () => {
    it('GET /api/departures/demo?airport=INVALID returns 400 with error and validCodes', async () => {
      const response = await request(app).get('/api/departures/demo?airport=INVALID');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('validCodes');
      expect(Array.isArray(response.body.validCodes)).toBe(true);
    });

    it('GET /api/arrivals/demo?airport=INVALID returns 400', async () => {
      const response = await request(app).get('/api/arrivals/demo?airport=INVALID');
      expect(response.status).toBe(400);
    });

    it('GET /api/departures?airport=INVALID returns 400', async () => {
      const response = await request(app).get('/api/departures?airport=INVALID');
      expect(response.status).toBe(400);
    });

    it('GET /api/arrivals?airport=INVALID returns 400', async () => {
      const response = await request(app).get('/api/arrivals?airport=INVALID');
      expect(response.status).toBe(400);
    });
  });

  describe('Static file serving', () => {
    it('GET / returns 200 with HTML content type', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/html/);
    });

    it('Response body contains Flight Information Display System', async () => {
      const response = await request(app).get('/');
      
      expect(response.text).toContain('Flight Information Display System');
    });
  });
});
