# ✈️ Flight Status Board

Real-time flight status board application displaying live aviation data from the OpenSky Network API.

## 🌟 Features

- **Real-time Flight Data**: Live flight information from OpenSky Network
- **Multiple Airports**: Support for Nordic airports (OSL, ARN, CPH, HEL, BGO)
- **Country Selection**: Filter airports by country (Norway, Sweden, Denmark, Finland)
- **Professional UI**: Terminal-style green-on-black display
- **Manual Refresh**: Click refresh button to get new flight data
- **Exactly 10 Flights**: Displays 10 flights in 2-column layout (5 per column)
- **Responsive Design**: Works on desktop and mobile devices
- **Real API Integration**: Connects to OpenSky Network with sample data fallback

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   # or
   make install
   ```

2. **Start the server:**
   ```bash
   npm start
   # or
   make start
   ```

3. **Open browser:**
   Navigate to `http://localhost:8080`

### Docker Deployment

1. **Build Docker image:**
   ```bash
   docker build -t flight-status-board .
   # or
   make build
   ```

2. **Run container:**
   ```bash
   docker run -p 8080:8080 flight-status-board
   # or
   make docker-run
   ```

3. **Using Docker Compose:**
   ```bash
   docker-compose up
   # or
   make docker-compose-up
   ```

### Railway Deployment

This application is ready for Railway deployment:

1. Push to GitHub
2. Connect repository to Railway
3. Railway will automatically detect the Dockerfile
4. Application will be available on assigned Railway URL

**Note:** Railway will automatically set the PORT environment variable.

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

### Countries
```
GET /api/countries
```
Returns list of available countries with their airports.

### Airports
```
GET /api/airports
GET /api/airports?country=NO
```
Returns airports, optionally filtered by country code.

### Flights
```
GET /api/flights?airport=OSL
```
Returns real-time flight data for specified airport.

Response format:
```json
{
  "airport": {
    "name": "Oslo Airport Gardermoen",
    "code": "OSL",
    "country": "Norway"
  },
  "flights": [
    {
      "callsign": "SAS123",
      "icao24": "3c6444",
      "airline": "SAS",
      "originCountry": "Norway",
      "latitude": 60.193,
      "longitude": 11.095,
      "altitude": 1200,
      "velocity": 250,
      "heading": 180,
      "verticalRate": -5.5,
      "status": "Arriving",
      "lastContact": "2026-02-15T10:30:00Z"
    }
  ],
  "count": 15,
  "timestamp": "2026-02-15T10:30:00Z"
}
```

## 🛠 Technology Stack

**Backend:**
- Node.js
- Express.js
- Axios (for OpenSky API calls)
- CORS middleware

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5
- CSS3 (with animations)

**Deployment:**
- Docker
- Docker Compose
- Railway compatible

## 🌐 OpenSky Network

This application uses the [OpenSky Network API](https://opensky-network.org/api/) to fetch real-time aircraft position data from worldwide ADS-B receivers.

**Data Refresh Rate:** Manual refresh via button click  
**Display:** Exactly 10 flights in 2-column layout  
**Coverage:** Worldwide ADS-B coverage  
**API Limits:** Public API has rate limits; consider authentication for higher limits  
**Fallback:** Uses sample data when API is unavailable (development/testing)

## 📋 Supported Airports

| Code | Airport Name | Country |
|------|--------------|---------|
| OSL | Oslo Airport Gardermoen | Norway |
| ARN | Stockholm Arlanda Airport | Sweden |
| CPH | Copenhagen Airport | Denmark |
| HEL | Helsinki-Vantaa Airport | Finland |
| BGO | Bergen Airport Flesland | Norway |

## 🔧 Development

### Project Structure
```
flight-status-board/
├── server.js              # Express backend
├── package.json           # Dependencies
├── public/
│   ├── index.html        # Frontend HTML
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       ├── api.js        # API communication
│       └── app.js        # Frontend logic
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose config
└── Makefile             # Build commands
```

### Environment Variables

- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment mode (production/development)

## 🧪 Testing

Test the API endpoints:
```bash
# Health check
curl http://localhost:8080/health

# Get countries
curl http://localhost:8080/api/countries

# Get airports
curl http://localhost:8080/api/airports

# Get flights for OSL
curl http://localhost:8080/api/flights?airport=OSL
```

Or use the Makefile:
```bash
make test
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Troubleshooting

**No flights showing:**
- Check if OpenSky API is accessible
- Try different airport/time of day
- In development, the app uses sample data if the API is unavailable
- Verify bounding box coordinates are correct

**API timeout or unavailable:**
- OpenSky API may be slow or rate-limited
- Application automatically falls back to sample data for testing
- In production with network access, wait a few minutes and retry
- Consider implementing caching for production use

**Sample data showing instead of real flights:**
- This is expected in sandboxed/offline environments
- Sample data shows "source": "sample" in API response
- Real OpenSky data shows "source": "opensky" in API response
- Deploy to production environment with internet access for real data

**Port already in use:**
- Change PORT environment variable
- Kill process using port 8080

## 📞 Support

For issues or questions, please open an issue on GitHub.
