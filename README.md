# ✈️ Flight Status Board

Real-time flight status board application displaying live aviation data from the OpenSky Network API.

![Flight Status Board](https://github.com/user-attachments/assets/cace8e6a-d73e-4324-83c3-739ea42a6529)

## 🌟 Features

- **Real-time Flight Data**: Live flight information from OpenSky Network
- **Norwegian Airports**: Support for 5 Norwegian airports (OSL, BGO, TRD, SVG, AES)
- **Manual Refresh**: Manual refresh button (no auto-refresh)
- **Exactly 10 Flights**: Displays exactly 10 flights in 2-column layout
- **Professional UI**: Terminal-style green-on-black display
- **Responsive Design**: Works on desktop and mobile devices
- **Real API Integration**: No mock data - all flights are real
- **Proper Units**: Altitude in feet, speed in knots

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open browser:**
   Navigate to `http://localhost:8080`

### Test Mode (for development without internet)

Start the server in test mode to use mock data:
```bash
TEST_MODE=true npm start
```

### Docker Deployment

1. **Build Docker image:**
   ```bash
   docker build -t flight-status-board .
   ```

2. **Run container:**
   ```bash
   docker run -p 8080:8080 flight-status-board
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
Returns list of available countries (Norway only).

### Airports
```
GET /api/airports
GET /api/airports?country=NO
```
Returns Norwegian airports.

### Flights
```
GET /api/flights?airport=OSL
```
Returns exactly 10 real-time flights for specified airport.

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
      "altitude": 3937,
      "velocity": 250,
      "heading": 180,
      "verticalRate": -5.5,
      "status": "Arriving",
      "lastContact": "2026-02-15T10:30:00Z"
    }
  ],
  "count": 10,
  "timestamp": "2026-02-15T10:30:00Z"
}
```

**Note:** Altitude is in feet, velocity is in knots.

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

**Data Refresh:** Manual only (button click)  
**Coverage:** Worldwide ADS-B coverage  
**API Limits:** Public API has rate limits; consider authentication for higher limits

## 📋 Supported Airports

| Code | Airport Name | Country |
|------|--------------|---------|
| OSL | Oslo Airport Gardermoen | Norway (default) |
| BGO | Bergen Airport Flesland | Norway |
| TRD | Trondheim Airport Værnes | Norway |
| SVG | Stavanger Airport Sola | Norway |
| AES | Ålesund Airport Vigra | Norway |

## 🔧 Development

### Project Structure
```
flight-status-board/
├── server.js              # Express backend (root)
├── package.json           # Dependencies
├── backend/
│   ├── server.js         # Backend copy
│   └── package.json      # Backend dependencies
├── public/
│   ├── index.html        # Frontend HTML
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       ├── api.js        # API communication
│       └── app.js        # Frontend logic
├── Dockerfile            # Docker configuration
└── README.md            # Documentation
```

### Environment Variables

- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment mode (production/development)
- `TEST_MODE` - Enable test mode with mock data (true/false)

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

**Test Mode:**
```bash
# Run in test mode with mock data
TEST_MODE=true npm start
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Troubleshooting

**No flights showing:**
- Check if OpenSky API is accessible
- Try different airport/time of day
- Verify bounding box coordinates are correct

**API timeout:**
- OpenSky API may be slow or rate-limited
- Wait a few minutes and retry
- Consider implementing caching

**Port already in use:**
- Change PORT environment variable
- Kill process using port 8080

## 📞 Support

For issues or questions, please open an issue on GitHub.
