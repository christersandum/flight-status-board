const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const TEST_MODE = process.env.TEST_MODE === 'true';

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Airport data with coordinates (bounding boxes for OpenSky API)
const AIRPORTS = {
  OSL: {
    name: 'Oslo Airport Gardermoen',
    code: 'OSL',
    country: 'Norway',
    lat: 60.1939,
    lon: 11.1004,
    bbox: { lamin: 59.9, lomin: 10.8, lamax: 60.5, lomax: 11.4 }
  },
  BGO: {
    name: 'Bergen Airport Flesland',
    code: 'BGO',
    country: 'Norway',
    lat: 60.2934,
    lon: 5.2181,
    bbox: { lamin: 60.1, lomin: 5.0, lamax: 60.5, lomax: 5.5 }
  },
  TRD: {
    name: 'Trondheim Airport Værnes',
    code: 'TRD',
    country: 'Norway',
    lat: 63.4578,
    lon: 10.9239,
    bbox: { lamin: 63.3, lomin: 10.7, lamax: 63.6, lomax: 11.1 }
  },
  SVG: {
    name: 'Stavanger Airport Sola',
    code: 'SVG',
    country: 'Norway',
    lat: 58.8767,
    lon: 5.6378,
    bbox: { lamin: 58.7, lomin: 5.4, lamax: 59.0, lomax: 5.9 }
  },
  AES: {
    name: 'Ålesund Airport Vigra',
    code: 'AES',
    country: 'Norway',
    lat: 62.5625,
    lon: 6.1197,
    bbox: { lamin: 62.4, lomin: 5.9, lamax: 62.7, lomax: 6.3 }
  }
};

const COUNTRIES = [
  { code: 'NO', name: 'Norway', airports: ['OSL', 'BGO', 'TRD', 'SVG', 'AES'] }
];

// OpenSky API base URL
const OPENSKY_API = 'https://opensky-network.org/api/states/all';

// Extract airline code from callsign
function extractAirline(callsign) {
  if (!callsign) return 'Unknown';
  const clean = callsign.trim();
  // Extract first 2-3 letters as airline code
  const match = clean.match(/^([A-Z]{2,3})/);
  return match ? match[1] : clean.substring(0, 3);
}

// Get flight status based on altitude and vertical rate
function getFlightStatus(altitude, verticalRate) {
  if (!altitude || altitude < 100) return 'On Ground';
  if (verticalRate > 1) return 'Departing';
  if (verticalRate < -1) return 'Arriving';
  return 'In Flight';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get countries endpoint
app.get('/api/countries', (req, res) => {
  res.json(COUNTRIES);
});

// Get airports endpoint
app.get('/api/airports', (req, res) => {
  const country = req.query.country;
  
  if (country) {
    const countryData = COUNTRIES.find(c => c.code === country);
    if (countryData) {
      const airports = countryData.airports.map(code => AIRPORTS[code]);
      return res.json(airports);
    }
  }
  
  res.json(Object.values(AIRPORTS));
});

// Get flights for a specific airport
app.get('/api/flights', async (req, res) => {
  try {
    const airportCode = req.query.airport || 'OSL';
    const airport = AIRPORTS[airportCode];
    
    if (!airport) {
      return res.status(400).json({ 
        error: 'Invalid airport code',
        validCodes: Object.keys(AIRPORTS)
      });
    }

    // TEST MODE: Return mock data for demonstration
    if (TEST_MODE) {
      const mockFlights = generateMockFlights(airport);
      return res.json({
        airport: airport,
        flights: mockFlights,
        count: mockFlights.length,
        timestamp: new Date().toISOString(),
        testMode: true
      });
    }

    // Call OpenSky API with bounding box
    const { lamin, lomin, lamax, lomax } = airport.bbox;
    const url = `${OPENSKY_API}?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    
    console.log(`Fetching flights for ${airportCode} from OpenSky API...`);
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'FlightStatusBoard/1.0'
      }
    });

    if (!response.data || !response.data.states) {
      return res.json({ 
        airport: airport,
        flights: [],
        timestamp: new Date().toISOString(),
        message: 'No flights detected in area'
      });
    }

    // Process OpenSky data
    // Format: [icao24, callsign, origin_country, time_position, last_contact, 
    //          longitude, latitude, baro_altitude, on_ground, velocity, 
    //          true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
    const flights = response.data.states
      .filter(state => state[1] && state[1].trim()) // Has callsign
      .slice(0, 10) // Limit to exactly 10 flights
      .map(state => ({
        icao24: state[0],
        callsign: state[1] ? state[1].trim() : 'Unknown',
        airline: extractAirline(state[1]),
        originCountry: state[2],
        latitude: state[6],
        longitude: state[5],
        altitude: state[7] ? Math.round(state[7] * 3.28084) : 0, // Convert meters to feet
        onGround: state[8],
        velocity: state[9] ? Math.round(state[9] * 1.94384) : 0, // Convert m/s to knots
        heading: state[10] ? Math.round(state[10]) : 0,
        verticalRate: state[11] ? parseFloat(state[11].toFixed(1)) : 0,
        status: getFlightStatus(state[7], state[11]),
        lastContact: state[4] ? new Date(state[4] * 1000).toISOString() : new Date().toISOString()
      }));

    res.json({
      airport: airport,
      flights: flights,
      count: flights.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching flights:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'OpenSky API timeout',
        message: 'The flight data service is taking too long to respond'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'OpenSky API error',
        message: error.response.data || 'Failed to fetch flight data'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch flight data. Please try again later.'
    });
  }
});

// Generate mock flights for testing
function generateMockFlights(airport) {
  const airlines = ['SAS', 'NAX', 'WIF', 'DLH', 'KLM', 'BAW', 'AFL', 'THY', 'UAE', 'QTR'];
  const flights = [];
  
  for (let i = 0; i < 10; i++) {
    const airline = airlines[i % airlines.length];
    const flightNum = String(100 + i * 11).padStart(3, '0');
    const altitude = 5000 + (i * 3000);
    const speed = 250 + (i * 20);
    
    flights.push({
      icao24: `${i.toString(16).padStart(6, '0')}`,
      callsign: `${airline}${flightNum}`,
      airline: airline,
      originCountry: i % 2 === 0 ? 'Norway' : ['Germany', 'Netherlands', 'United Kingdom', 'Russia', 'Turkey'][i % 5],
      latitude: airport.lat + (Math.random() - 0.5) * 0.3,
      longitude: airport.lon + (Math.random() - 0.5) * 0.3,
      altitude: altitude,
      onGround: false,
      velocity: speed,
      heading: (i * 36) % 360,
      verticalRate: i % 3 === 0 ? 5.2 : i % 3 === 1 ? -2.1 : 0.1,
      status: i % 3 === 0 ? 'Departing' : i % 3 === 1 ? 'Arriving' : 'In Flight',
      lastContact: new Date(Date.now() - (i * 5000)).toISOString()
    });
  }
  
  return flights;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Flight Status Board server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Test Mode: ${TEST_MODE ? 'ENABLED (Mock data)' : 'DISABLED (Real OpenSky API)'}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});
