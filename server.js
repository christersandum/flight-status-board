const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

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
  ARN: {
    name: 'Stockholm Arlanda Airport',
    code: 'ARN',
    country: 'Sweden',
    lat: 59.6519,
    lon: 17.9186,
    bbox: { lamin: 59.4, lomin: 17.7, lamax: 59.9, lomax: 18.2 }
  },
  CPH: {
    name: 'Copenhagen Airport',
    code: 'CPH',
    country: 'Denmark',
    lat: 55.6181,
    lon: 12.6561,
    bbox: { lamin: 55.4, lomin: 12.4, lamax: 55.8, lomax: 12.9 }
  },
  HEL: {
    name: 'Helsinki-Vantaa Airport',
    code: 'HEL',
    country: 'Finland',
    lat: 60.3172,
    lon: 24.9633,
    bbox: { lamin: 60.1, lomin: 24.7, lamax: 60.5, lomax: 25.2 }
  },
  BGO: {
    name: 'Bergen Airport Flesland',
    code: 'BGO',
    country: 'Norway',
    lat: 60.2934,
    lon: 5.2181,
    bbox: { lamin: 60.1, lomin: 5.0, lamax: 60.5, lomax: 5.5 }
  }
};

const COUNTRIES = [
  { code: 'NO', name: 'Norway', airports: ['OSL', 'BGO'] },
  { code: 'SE', name: 'Sweden', airports: ['ARN'] },
  { code: 'DK', name: 'Denmark', airports: ['CPH'] },
  { code: 'FI', name: 'Finland', airports: ['HEL'] }
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
      .slice(0, 20) // Limit to 20 flights
      .map(state => ({
        icao24: state[0],
        callsign: state[1] ? state[1].trim() : 'Unknown',
        airline: extractAirline(state[1]),
        originCountry: state[2],
        latitude: state[6],
        longitude: state[5],
        altitude: state[7] ? Math.round(state[7]) : 0,
        onGround: state[8],
        velocity: state[9] ? Math.round(state[9] * 3.6) : 0, // Convert m/s to km/h
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Flight Status Board server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});
