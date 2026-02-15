# Flight Status Board

A complete flight status board application with a C backend and modern web frontend, displaying live flight departures from airports worldwide.

![Flight Status Board Screenshot](https://github.com/user-attachments/assets/4216e64a-472a-44f9-becd-a8be092775eb)

## ✈️ Features

- **Real-time Flight Data**: Fetches flight information from aviation APIs with mock data fallback
- **Country Selection**: Choose from 12 countries worldwide
- **Airport Selection**: Browse airports by country with full names and IATA codes
- **Flight Display**: 20 flights in a beautiful 2-column layout showing:
  - Departure time
  - Flight number
  - Airline
  - Destination
  - Terminal
  - Gate
  - Status (On-time, Delayed, Boarding, Departed, Cancelled)
- **Auto-refresh**: Updates every 60 seconds automatically
- **Default Airport**: Starts with Oslo Gardermoen Airport (OSL), Norway
- **Responsive Design**: Works on desktop and mobile devices
- **Professional UI**: Modern gradient design with smooth animations

## 🏗️ Architecture

### Backend (C)
- Built with pure C for high performance
- HTTP server on port 8080
- RESTful API endpoints:
  - `GET /api/countries` - List all countries
  - `GET /api/airports?country=XX` - Get airports for a country
  - `GET /api/flights?airport=ICAO` - Get flights for an airport
  - `GET /health` - Health check endpoint
- Integration with OpenSky Network API
- Mock data fallback for demonstration

### Frontend (Web)
- Modern HTML5, CSS3, and JavaScript
- No framework dependencies - pure vanilla JS
- Responsive grid layout
- Beautiful purple gradient theme
- Real-time API communication
- Auto-refresh functionality

## 🚀 Quick Start

### Prerequisites
- Docker (for containerized deployment)
- OR GCC, libcurl, and nginx (for manual build)

### Running with Docker

```bash
# Build the Docker image
docker build -t flight-status-board .

# Run the container
docker run -d -p 80:80 -p 8080:8080 flight-status-board

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8080
```

### Running with Docker Compose

```bash
docker-compose up -d
```

### Manual Build (Development)

#### Backend
```bash
cd backend
make
./build/flight-status-board
```

Backend will start on port 8080.

#### Frontend
Serve the `frontend` directory with any web server:
```bash
cd frontend
python3 -m http.server 80
# Or use nginx, Apache, etc.
```

## 📡 API Documentation

### Get Countries
```http
GET /api/countries
```

Returns a JSON array of countries:
```json
[
  {"code": "NO", "name": "Norway"},
  {"code": "SE", "name": "Sweden"}
]
```

### Get Airports
```http
GET /api/airports?country=NO
```

Returns airports for the specified country:
```json
[
  {
    "icao": "ENGM",
    "iata": "OSL",
    "name": "Oslo Gardermoen Airport",
    "city": "Oslo"
  }
]
```

### Get Flights
```http
GET /api/flights?airport=ENGM
```

Returns up to 20 flights:
```json
[
  {
    "departure_time": "17:00",
    "flight_number": "SAS100",
    "airline": "SAS",
    "destination": "London",
    "terminal": "1",
    "gate": "A1",
    "status": "On Time"
  }
]
```

## 🛠️ Development

### Backend Development
The backend is built with CMake and Make:

```bash
cd backend

# Using Make
make clean
make

# Using CMake
mkdir build && cd build
cmake ..
make
```

### Building for Production
The multi-stage Dockerfile optimizes the build:
1. Stage 1: Builds C backend with GCC and CMake
2. Stage 2: Creates minimal Ubuntu image with runtime dependencies
3. Combines backend binary and frontend files
4. Runs both services with a startup script

## 🌍 Deployment to Railway

This application is configured for Railway deployment:

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Auto-Deploy**: Railway will automatically build the Docker image
3. **Environment**: The application runs on:
   - Frontend: Port 80 (Railway will assign a public URL)
   - Backend: Port 8080
4. **Health Checks**: Uses `/health` endpoint for monitoring

### Railway Configuration
- Dockerfile builds both services
- Nginx serves frontend on port 80
- C backend API on port 8080
- Both services start automatically via startup script

## 📦 Project Structure

```
flight-status-board/
├── backend/
│   ├── src/
│   │   ├── main.c           # HTTP server and routing
│   │   ├── api.c            # External API integration
│   │   ├── api.h
│   │   ├── flight_data.c    # Flight data processing
│   │   └── flight_data.h
│   ├── CMakeLists.txt       # CMake configuration
│   └── Makefile             # Make configuration
├── frontend/
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── style.css        # Styling
│   └── js/
│       ├── app.js           # Application logic
│       └── api.js           # API communication
├── Dockerfile               # Multi-stage Docker build
├── docker-compose.yml       # Docker Compose config
├── .dockerignore           # Docker build optimization
└── README.md               # This file
```

## 🔧 Technologies Used

- **Backend**: C, libcurl, POSIX sockets
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Build**: CMake, Make, GCC
- **Web Server**: Nginx
- **Containerization**: Docker, multi-stage builds
- **API**: OpenSky Network (free, no API key required)

## 🎨 Design Features

- **Gradient Background**: Beautiful purple gradient (667eea → 764ba2)
- **Glass Morphism**: Frosted glass effects with backdrop filters
- **Status Colors**:
  - 🟢 Green: On Time
  - 🟠 Orange: Delayed
  - 🔵 Blue: Boarding
  - ⚫ Gray: Departed
  - 🔴 Red: Cancelled
- **Hover Effects**: Smooth transitions and elevations
- **Loading States**: Animated spinner during data fetch
- **Responsive**: Adapts from mobile to desktop

## 📝 License

This project is open source and available for use.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🙏 Credits

- Flight data powered by OpenSky Network
- Built with modern web standards
- Designed for Railway deployment

