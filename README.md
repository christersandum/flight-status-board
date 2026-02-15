# ✈️ Flight Status Board

Real-time flight status board application displaying live aviation data from the AviationStack API.

## 🌟 Features

- **Real-time Flight Data**: Live flight information from AviationStack API
- **Multiple Airports**: Support for Nordic airports (OSL, ARN, CPH, HEL, BGO)
- **Country Selection**: Filter airports by country (Norway, Sweden, Denmark, Finland)
- **Professional UI**: Terminal-style green-on-black display
- **Auto-refresh**: Updates every 60 seconds
- **Responsive Design**: Works on desktop and mobile devices
- **Real API Integration**: No mock data - all flights are real

## 🚀 Quick Start

### Prerequisites

**API Key:** You'll need a free AviationStack API key:
1. Sign up at [AviationStack](https://aviationstack.com/)
2. Get your free API key from the dashboard (500 requests/month)
3. Set the environment variable: `AVIATIONSTACK_API_KEY=your_key_here`

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   # or
   make install
   ```

2. **Set your API key:**
   ```bash
   export AVIATIONSTACK_API_KEY=your_api_key_here
   ```

3. **Start the server:**
   ```bash
   npm start
   # or
   make start
   ```

4. **Open browser:**
   Navigate to `http://localhost:8080`

### Docker Deployment

1. **Build Docker image:**
   ```bash
   docker build -t flight-status-board .
   # or
   make build
   ```

2. **Run container with API key:**
   ```bash
   docker run -p 8080:8080 -e AVIATIONSTACK_API_KEY=your_key_here flight-status-board
   # or
   make docker-run
   ```

3. **Using Docker Compose:**
   
   Create a `.env` file:
   ```
   AVIATIONSTACK_API_KEY=your_api_key_here
   ```
   
   Then run:
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
4. **Add environment variable**: Set `AVIATIONSTACK_API_KEY` in Railway dashboard
5. Application will be available on assigned Railway URL

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
- Axios (for AviationStack API calls)
- CORS middleware

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5
- CSS3 (with animations)

**Deployment:**
- Docker
- Docker Compose
- Railway compatible

## 🌐 AviationStack API

This application uses the [AviationStack API](https://aviationstack.com/) to fetch real-time flight data globally.

**Data Refresh Rate:** Every 60 seconds  
**Coverage:** Global flight tracking with real-time status  
**Free Tier:** 500 API requests per month  
**Features:** Flight status, departure/arrival info, airline details, live position data

### API Key Setup

1. Create free account at [aviationstack.com](https://aviationstack.com/)
2. Copy your API key from the dashboard
3. Set environment variable:
   ```bash
   export AVIATIONSTACK_API_KEY=your_api_key_here
   ```
4. Or use demo mode for testing:
   ```bash
   # No API key needed - returns 5 sample flights for testing purposes
   npm start
   ```

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
- `AVIATIONSTACK_API_KEY` - Your AviationStack API key (required for production)

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
- Check if AviationStack API key is set correctly
- Verify API key has available requests (check dashboard)
- Try different airport/time of day
- Check console logs for API errors

**API timeout:**
- AviationStack API may be slow or rate-limited
- Check if you've exceeded free tier limit (500 requests/month)
- Wait a few minutes and retry

**Port already in use:**
- Change PORT environment variable
- Kill process using port 8080

**Invalid API Key:**
- Verify `AVIATIONSTACK_API_KEY` is set correctly
- Check key at [aviationstack.com/dashboard](https://aviationstack.com/dashboard)
- Ensure no extra spaces or quotes in the key

## 📞 Support

For issues or questions, please open an issue on GitHub.
