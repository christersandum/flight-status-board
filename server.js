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

// Airport data with ICAO codes for OpenSky API
const AIRPORTS = {
  OSL: {
    name: 'Oslo Airport Gardermoen',
    code: 'OSL',
    icao: 'ENGM',
    country: 'Norway',
    lat: 60.1939,
    lon: 11.1004,
    bbox: { lamin: 59.9, lomin: 10.8, lamax: 60.5, lomax: 11.4 }
  },
  ARN: {
    name: 'Stockholm Arlanda Airport',
    code: 'ARN',
    icao: 'ESSA',
    country: 'Sweden',
    lat: 59.6519,
    lon: 17.9186,
    bbox: { lamin: 59.4, lomin: 17.7, lamax: 59.9, lomax: 18.2 }
  },
  CPH: {
    name: 'Copenhagen Airport',
    code: 'CPH',
    icao: 'EKCH',
    country: 'Denmark',
    lat: 55.6181,
    lon: 12.6561,
    bbox: { lamin: 55.4, lomin: 12.4, lamax: 55.8, lomax: 12.9 }
  },
  HEL: {
    name: 'Helsinki-Vantaa Airport',
    code: 'HEL',
    icao: 'EFHK',
    country: 'Finland',
    lat: 60.3172,
    lon: 24.9633,
    bbox: { lamin: 60.1, lomin: 24.7, lamax: 60.5, lomax: 25.2 }
  },
  BGO: {
    name: 'Bergen Airport Flesland',
    code: 'BGO',
    icao: 'ENBR',
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

// Common airport ICAO to name mapping for display
const AIRPORT_NAMES = {
  // Nordics
  'ENGM': 'OSLO GARDERMOEN',
  'ENBR': 'BERGEN FLESLAND',
  'ENZV': 'STAVANGER',
  'ENTC': 'TROMSØ',
  'ENVA': 'TRONDHEIM',
  'ESSA': 'STOCKHOLM ARLANDA',
  'ESGG': 'GOTHENBURG',
  'EKCH': 'COPENHAGEN',
  'EKBI': 'BILLUND',
  'EFHK': 'HELSINKI VANTAA',
  
  // UK & Ireland
  'EGLL': 'LONDON HEATHROW',
  'EGKK': 'LONDON GATWICK',
  'EGSS': 'LONDON STANSTED',
  'EGGW': 'LONDON LUTON',
  'EGCC': 'MANCHESTER',
  'EIDW': 'DUBLIN',
  
  // Central Europe
  'EDDF': 'FRANKFURT',
  'EDDM': 'MUNICH',
  'EDDB': 'BERLIN BRANDENBURG',
  'EDDH': 'HAMBURG',
  'EHAM': 'AMSTERDAM SCHIPHOL',
  'EBBR': 'BRUSSELS',
  'LOWW': 'VIENNA',
  'LSZH': 'ZURICH',
  
  // Southern Europe
  'LFPG': 'PARIS CHARLES DE GAULLE',
  'LFPO': 'PARIS ORLY',
  'LEMD': 'MADRID',
  'LEBL': 'BARCELONA',
  'LIRF': 'ROME FIUMICINO',
  'LIMC': 'MILAN MALPENSA',
  
  // North America
  'KJFK': 'NEW YORK JFK',
  'KEWR': 'NEWARK',
  'KORD': 'CHICAGO O\'HARE',
  'KLAX': 'LOS ANGELES',
  'KSFO': 'SAN FRANCISCO',
  'KATL': 'ATLANTA',
  'KDFW': 'DALLAS FORT WORTH',
  'KDEN': 'DENVER',
  'KLAS': 'LAS VEGAS',
  'KMIA': 'MIAMI',
  'CYYZ': 'TORONTO PEARSON',
  
  // Asia & Middle East
  'OMDB': 'DUBAI',
  'OTHH': 'DOHA',
  'VHHH': 'HONG KONG',
  'WSSS': 'SINGAPORE',
  'RJTT': 'TOKYO HANEDA',
  'RKSI': 'SEOUL INCHEON',
  'ZBAA': 'BEIJING',
  'ZSPD': 'SHANGHAI PUDONG',
  'VIDP': 'DELHI',
  'VABB': 'MUMBAI',
  
  // Oceania
  'YSSY': 'SYDNEY',
  'YMML': 'MELBOURNE',
  'NZAA': 'AUCKLAND'
};

// OpenSky API endpoints
const OPENSKY_API_STATES = 'https://opensky-network.org/api/states/all';
const OPENSKY_API_DEPARTURES = 'https://opensky-network.org/api/flights/departure';
const OPENSKY_API_ARRIVALS = 'https://opensky-network.org/api/flights/arrival';

// Extract airline code from callsign (for legacy /api/flights endpoint)
function extractAirline(callsign) {
  if (!callsign) return 'Unknown';
  const clean = callsign.trim();
  const match = clean.match(/^([A-Z]{2,3})/);
  return match ? match[1] : clean.substring(0, 3);
}

// Get flight status based on altitude and vertical rate (for legacy /api/flights endpoint)
function getFlightStatus(altitude, verticalRate) {
  if (!altitude || altitude < 100) return 'On Ground';
  if (verticalRate > 1) return 'Departing';
  if (verticalRate < -1) return 'Arriving';
  return 'In Flight';
}

// Get airport name from ICAO code
function getAirportName(icao) {
  if (!icao || typeof icao !== 'string') return 'UNKNOWN';
  return AIRPORT_NAMES[icao.toUpperCase()] || icao.toUpperCase();
}

// Generate random gate number for display
function generateGate() {
  const terminals = ['A', 'B', 'C', 'D'];
  const terminal = terminals[Math.floor(Math.random() * terminals.length)];
  const gateNumber = Math.floor(Math.random() * 50) + 1;
  return `${terminal}${gateNumber.toString().padStart(2, '0')}`;
}

// Determine departure status based on time
function getDepartureStatus(firstSeen, lastSeen) {
  const now = Math.floor(Date.now() / 1000);
  const departureTime = firstSeen || now;
  const timeSinceDeparture = now - departureTime;
  
  if (timeSinceDeparture > 1800) {
    return 'Departed';
  } else if (timeSinceDeparture > 600) {
    return 'Boarding';
  } else {
    return 'Scheduled';
  }
}

// Determine arrival status based on time
function getArrivalStatus(firstSeen, lastSeen) {
  const now = Math.floor(Date.now() / 1000);
  const arrivalTime = lastSeen || now;
  const timeUntilArrival = arrivalTime - now;
  
  if (timeUntilArrival < -3600) {
    return 'Landed';
  } else if (timeUntilArrival < 1800) {
    return 'On Approach';
  } else {
    return 'Expected';
  }
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

// Get departures for a specific airport
app.get('/api/departures', async (req, res) => {
  try {
    const airportCode = req.query.airport || 'OSL';
    const airport = AIRPORTS[airportCode];
    
    if (!airport) {
      return res.status(400).json({ 
        error: 'Invalid airport code',
        validCodes: Object.keys(AIRPORTS)
      });
    }

    const icao = airport.icao;
    const now = Math.floor(Date.now() / 1000);
    const begin = now - 7200; // 2 hours ago
    const end = now;
    
    const url = `${OPENSKY_API_DEPARTURES}?airport=${icao}&begin=${begin}&end=${end}`;
    
    console.log(`Fetching departures for ${airportCode} (${icao}) from OpenSky API...`);
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'FlightStatusBoard/1.0'
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      return res.json({ 
        airport: airport,
        flights: [],
        timestamp: new Date().toISOString(),
        message: 'No departures found'
      });
    }

    // Process departure data
    const flights = response.data
      .filter(flight => flight.callsign && flight.callsign.trim())
      .slice(0, 30) // Limit to 30 flights
      .map(flight => ({
        callsign: flight.callsign ? flight.callsign.trim() : 'Unknown',
        estDepartureAirport: flight.estDepartureAirport || icao,
        estArrivalAirport: flight.estArrivalAirport || 'Unknown',
        estArrivalAirportName: getAirportName(flight.estArrivalAirport),
        firstSeen: flight.firstSeen,
        lastSeen: flight.lastSeen,
        gate: generateGate(),
        status: getDepartureStatus(flight.firstSeen, flight.lastSeen)
      }))
      .sort((a, b) => (a.firstSeen || 0) - (b.firstSeen || 0));

    res.json({
      airport: airport,
      flights: flights,
      count: flights.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching departures:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'OpenSky API timeout',
        message: 'The flight data service is taking too long to respond'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'OpenSky API error',
        message: error.response.data || 'Failed to fetch departure data'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch departure data. Please try again later.',
      flights: []
    });
  }
});

// Get arrivals for a specific airport
app.get('/api/arrivals', async (req, res) => {
  try {
    const airportCode = req.query.airport || 'OSL';
    const airport = AIRPORTS[airportCode];
    
    if (!airport) {
      return res.status(400).json({ 
        error: 'Invalid airport code',
        validCodes: Object.keys(AIRPORTS)
      });
    }

    const icao = airport.icao;
    const now = Math.floor(Date.now() / 1000);
    const begin = now - 7200; // 2 hours ago
    const end = now;
    
    const url = `${OPENSKY_API_ARRIVALS}?airport=${icao}&begin=${begin}&end=${end}`;
    
    console.log(`Fetching arrivals for ${airportCode} (${icao}) from OpenSky API...`);
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'FlightStatusBoard/1.0'
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      return res.json({ 
        airport: airport,
        flights: [],
        timestamp: new Date().toISOString(),
        message: 'No arrivals found'
      });
    }

    // Process arrival data
    const flights = response.data
      .filter(flight => flight.callsign && flight.callsign.trim())
      .slice(0, 30) // Limit to 30 flights
      .map(flight => ({
        callsign: flight.callsign ? flight.callsign.trim() : 'Unknown',
        estDepartureAirport: flight.estDepartureAirport || 'Unknown',
        estDepartureAirportName: getAirportName(flight.estDepartureAirport),
        estArrivalAirport: flight.estArrivalAirport || icao,
        firstSeen: flight.firstSeen,
        lastSeen: flight.lastSeen,
        gate: generateGate(),
        status: getArrivalStatus(flight.firstSeen, flight.lastSeen)
      }))
      .sort((a, b) => (a.lastSeen || 0) - (b.lastSeen || 0));

    res.json({
      airport: airport,
      flights: flights,
      count: flights.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching arrivals:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'OpenSky API timeout',
        message: 'The flight data service is taking too long to respond'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'OpenSky API error',
        message: error.response.data || 'Failed to fetch arrival data'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch arrival data. Please try again later.',
      flights: []
    });
  }
});

// Demo endpoint with mock data for testing
app.get('/api/departures/demo', async (req, res) => {
  const airportCode = req.query.airport || 'OSL';
  const airport = AIRPORTS[airportCode];
  
  if (!airport) {
    return res.status(400).json({ 
      error: 'Invalid airport code',
      validCodes: Object.keys(AIRPORTS)
    });
  }

  const now = Math.floor(Date.now() / 1000);
  
  // Mock departure data
  const mockFlights = [
    { callsign: 'SK4455', estArrivalAirport: 'ESSA', firstSeen: now - 1800, lastSeen: now - 1200 },
    { callsign: 'DY622', estArrivalAirport: 'ENBR', firstSeen: now - 900, lastSeen: now - 300 },
    { callsign: 'LH867', estArrivalAirport: 'EDDF', firstSeen: now + 600, lastSeen: now + 1200 },
    { callsign: 'KL1152', estArrivalAirport: 'EHAM', firstSeen: now + 1200, lastSeen: now + 1800 },
    { callsign: 'BA762', estArrivalAirport: 'EGLL', firstSeen: now + 1800, lastSeen: now + 2400 },
    { callsign: 'AF1268', estArrivalAirport: 'LFPG', firstSeen: now + 2400, lastSeen: now + 3000 },
    { callsign: 'AY681', estArrivalAirport: 'EFHK', firstSeen: now + 3000, lastSeen: now + 3600 },
    { callsign: 'SK1465', estArrivalAirport: 'EKCH', firstSeen: now + 3600, lastSeen: now + 4200 }
  ];

  const flights = mockFlights.map(flight => ({
    callsign: flight.callsign,
    estDepartureAirport: airport.icao,
    estArrivalAirport: flight.estArrivalAirport,
    estArrivalAirportName: getAirportName(flight.estArrivalAirport),
    firstSeen: flight.firstSeen,
    lastSeen: flight.lastSeen,
    gate: generateGate(),
    status: getDepartureStatus(flight.firstSeen, flight.lastSeen)
  }));

  res.json({
    airport: airport,
    flights: flights,
    count: flights.length,
    timestamp: new Date().toISOString()
  });
});

// Demo endpoint with mock arrivals data for testing
app.get('/api/arrivals/demo', async (req, res) => {
  const airportCode = req.query.airport || 'OSL';
  const airport = AIRPORTS[airportCode];
  
  if (!airport) {
    return res.status(400).json({ 
      error: 'Invalid airport code',
      validCodes: Object.keys(AIRPORTS)
    });
  }

  const now = Math.floor(Date.now() / 1000);
  
  // Mock arrival data
  const mockFlights = [
    { callsign: 'SK4456', estDepartureAirport: 'ESSA', firstSeen: now - 5400, lastSeen: now - 3600 },
    { callsign: 'DY623', estDepartureAirport: 'ENBR', firstSeen: now - 4800, lastSeen: now - 900 },
    { callsign: 'LH868', estDepartureAirport: 'EDDF', firstSeen: now - 7200, lastSeen: now - 300 },
    { callsign: 'KL1153', estDepartureAirport: 'EHAM', firstSeen: now - 6600, lastSeen: now + 600 },
    { callsign: 'BA763', estDepartureAirport: 'EGLL', firstSeen: now - 6000, lastSeen: now + 1200 },
    { callsign: 'AF1269', estDepartureAirport: 'LFPG', firstSeen: now - 5400, lastSeen: now + 1800 },
    { callsign: 'AY682', estDepartureAirport: 'EFHK', firstSeen: now - 4800, lastSeen: now + 2400 }
  ];

  const flights = mockFlights.map(flight => ({
    callsign: flight.callsign,
    estDepartureAirport: flight.estDepartureAirport,
    estDepartureAirportName: getAirportName(flight.estDepartureAirport),
    estArrivalAirport: airport.icao,
    firstSeen: flight.firstSeen,
    lastSeen: flight.lastSeen,
    gate: generateGate(),
    status: getArrivalStatus(flight.firstSeen, flight.lastSeen)
  }));

  res.json({
    airport: airport,
    flights: flights,
    count: flights.length,
    timestamp: new Date().toISOString()
  });
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
    const url = `${OPENSKY_API_STATES}?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    
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
