const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY || 'demo';

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

// AviationStack API base URL
const AVIATIONSTACK_API = 'https://api.aviationstack.com/v1/flights';

// Extract airline code from callsign or flight number
function extractAirline(callsign) {
  if (!callsign) return 'Unknown';
  const clean = callsign.trim();
  // Extract first 2-3 letters as airline code
  const match = clean.match(/^([A-Z]{2,3})/);
  return match ? match[1] : clean.substring(0, 3);
}

// Get flight status based on flight data
function getFlightStatus(flight) {
  if (!flight) return 'Unknown';
  
  // Check flight status from API
  if (flight.flight_status) {
    const status = flight.flight_status.toLowerCase();
    if (status === 'scheduled') return 'Scheduled';
    if (status === 'active') return 'In Flight';
    if (status === 'landed') return 'Landed';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'diverted') return 'Diverted';
  }
  
  // Fallback to departure/arrival status
  if (flight.departure && flight.departure.actual) return 'Departing';
  if (flight.arrival && flight.arrival.estimated) return 'Arriving';
  
  return 'Scheduled';
}

// Transform AviationStack flight data to our format
function transformAviationStackFlight(flight, airport) {
  // Extract country from departure airport or fallback to arrival
  const departureAirport = flight.departure?.iata || 'Unknown';
  const arrivalAirport = flight.arrival?.iata || 'Unknown';
  const originInfo = `${departureAirport} → ${arrivalAirport}`;
  
  return {
    icao24: flight.flight?.icao || 'N/A',
    callsign: flight.flight?.iata || flight.flight?.icao || 'Unknown',
    airline: flight.airline?.name || extractAirline(flight.flight?.iata),
    originCountry: originInfo,
    latitude: flight.live?.latitude || 0,
    longitude: flight.live?.longitude || 0,
    altitude: flight.live?.altitude || 0,
    onGround: flight.live?.is_ground || false,
    velocity: Math.round(flight.live?.speed_horizontal || 0),
    heading: flight.live?.direction || 0,
    verticalRate: flight.live?.speed_vertical || 0,
    status: getFlightStatus(flight),
    lastContact: flight.live?.updated || flight.flight_date || new Date().toISOString()
  };
}

// Generate sample flights for demo mode
function generateSampleFlights(airportCode) {
  const airlines = ['SAS', 'Norwegian', 'Lufthansa', 'KLM', 'British Airways'];
  const statuses = ['Scheduled', 'In Flight', 'Arriving', 'Departing', 'Landed'];
  const destinations = ['LHR', 'AMS', 'CDG', 'FRA', 'ARN'];
  const flights = [];
  
  for (let i = 0; i < 5; i++) {
    flights.push({
      icao24: `ABC${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      callsign: `${airlines[i % airlines.length]}${Math.floor(Math.random() * 900 + 100)}`,
      airline: airlines[i % airlines.length],
      originCountry: `${airportCode} → ${destinations[i % destinations.length]}`,
      latitude: 60.19 + (Math.random() - 0.5) * 0.2,
      longitude: 11.10 + (Math.random() - 0.5) * 0.2,
      altitude: Math.floor(Math.random() * 10000),
      onGround: false,
      velocity: Math.floor(Math.random() * 500 + 200),
      heading: Math.floor(Math.random() * 360),
      verticalRate: (Math.random() - 0.5) * 10,
      status: statuses[i % statuses.length],
      lastContact: new Date().toISOString()
    });
  }
  
  return flights;
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

    // If using demo key, return sample data
    if (AVIATIONSTACK_API_KEY === 'demo') {
      console.log(`Demo mode: Returning sample flights for ${airportCode}`);
      return res.json({
        airport: airport,
        flights: generateSampleFlights(airportCode),
        count: 5,
        timestamp: new Date().toISOString(),
        message: 'Demo mode - sample flight data (set AVIATIONSTACK_API_KEY for real data)'
      });
    }

    // Call AviationStack API
    const url = `${AVIATIONSTACK_API}`;
    const params = {
      access_key: AVIATIONSTACK_API_KEY,
      dep_iata: airportCode,
      limit: 20
    };
    
    console.log(`Fetching flights for ${airportCode} from AviationStack API...`);
    const response = await axios.get(url, {
      params: params,
      timeout: 10000,
      headers: {
        'User-Agent': 'FlightStatusBoard/1.0'
      }
    });

    if (!response.data || !response.data.data) {
      // Try arrival flights if no departure flights
      params.arr_iata = airportCode;
      delete params.dep_iata;
      
      const arrivalResponse = await axios.get(url, {
        params: params,
        timeout: 10000,
        headers: {
          'User-Agent': 'FlightStatusBoard/1.0'
        }
      });
      
      if (!arrivalResponse.data || !arrivalResponse.data.data || arrivalResponse.data.data.length === 0) {
        return res.json({ 
          airport: airport,
          flights: [],
          count: 0,
          timestamp: new Date().toISOString(),
          message: 'No flights detected for this airport'
        });
      }
      
      // Process arrival flights
      const flights = arrivalResponse.data.data.map(flight => transformAviationStackFlight(flight, airport));
      
      return res.json({
        airport: airport,
        flights: flights,
        count: flights.length,
        timestamp: new Date().toISOString()
      });
    }

    // Process departure flights
    const flights = response.data.data.map(flight => transformAviationStackFlight(flight, airport));

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
        error: 'AviationStack API timeout',
        message: 'The flight data service is taking too long to respond'
      });
    }
    
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      return res.status(error.response.status).json({ 
        error: 'AviationStack API error',
        message: error.response.data?.error?.message || 'Failed to fetch flight data',
        details: error.response.data
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
  console.log(`API: AviationStack (${AVIATIONSTACK_API_KEY === 'demo' ? 'demo mode' : 'API key configured'})`);
  console.log(`Access the application at http://localhost:${PORT}`);
});
