# Flight Status Board ✈️

A real-time flight status board application with a C backend server and modern web frontend. Displays flight information in an airport-style interface with automatic updates.

## Features

- 🛫 Real-time flight status display (20 flights)
- 🌍 Multiple airport selection
- ⏰ Auto-refresh every 30 seconds
- 📊 Flight information includes:
  - Flight number and airline
  - Scheduled and estimated departure times
  - Destination
  - Terminal and gate information
  - Flight status (On Time, Delayed, Boarding, etc.)
  - Delay duration
- 📱 Responsive design for mobile and desktop
- 🎨 Airport-style display with color-coded status indicators

## Architecture

### Backend (C)
- Pure C HTTP server (no external dependencies)
- RESTful API endpoints
- Flight data API integration support
- Static file serving
- Mock data for demonstration

### Frontend (HTML/CSS/JavaScript)
- Vanilla JavaScript (no frameworks)
- Modern CSS Grid layout
- Responsive design
- Real-time updates

## Prerequisites

- GCC compiler (or any C compiler)
- Make (optional, for easy building)
- A modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/christersandum/flight-status-board.git
cd flight-status-board
```

2. Build the server:
```bash
make
```

Or compile manually:
```bash
gcc -Wall -Wextra -std=c99 -o flight-server backend/server.c
```

## Usage

1. Start the server:
```bash
make run
```

Or run directly:
```bash
./flight-server
```

2. Open your web browser and navigate to:
```
http://localhost:8080
```

3. Select your airport from the dropdown menu to view flights

## API Integration

The application supports integration with flight data APIs. To connect to a real API:

1. Edit `config.txt` and add your API key:
```
API_KEY=your_api_key_here
```

2. Supported flight data providers:
   - [AviationStack](https://aviationstack.com/)
   - [FlightAware](https://flightaware.com/commercial/flightxml/)
   - [Aviation Edge](https://aviation-edge.com/)

**Note:** The application uses mock data by default for demonstration purposes.

## API Endpoints

### GET /api/flights
Returns the next 20 flights for the specified airport.

**Parameters:**
- `airport` (optional): IATA airport code (default: JFK)

**Example:**
```
http://localhost:8080/api/flights?airport=LAX
```

**Response:**
```json
[
  {
    "flight_number": "AA123",
    "airline": "American Airlines",
    "origin": "LAX",
    "destination": "JFK",
    "scheduled_time": "2026-02-15T10:30:00",
    "estimated_time": "2026-02-15T10:30:00",
    "status": "On Time",
    "terminal": "1",
    "gate": "A12",
    "delay_minutes": 0
  }
]
```

### GET /api/airports
Returns a list of supported airports.

**Example:**
```
http://localhost:8080/api/airports
```

## Project Structure

```
flight-status-board/
├── backend/
│   └── server.c          # C HTTP server and API handler
├── public/
│   ├── index.html        # Main HTML page
│   ├── style.css         # Styling (airport board theme)
│   └── app.js            # Frontend JavaScript
├── Makefile              # Build configuration
├── config.txt            # API configuration
└── README.md             # This file
```

## Customization

### Change Server Port
Edit `backend/server.c` and modify the `PORT` constant:
```c
#define PORT 8080
```

### Adjust Refresh Rate
Edit `public/app.js` and modify the `REFRESH_SECONDS` constant:
```javascript
const REFRESH_SECONDS = 30;
```

### Add More Airports
Edit `backend/server.c` in the `/api/airports` endpoint handler to add more airports.

### Modify Flight Count
Edit `backend/server.c` and modify the `MAX_FLIGHTS` constant:
```c
#define MAX_FLIGHTS 20
```

## Development

### Building
```bash
make
```

### Running
```bash
make run
```

### Cleaning
```bash
make clean
```

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Port Already in Use
If port 8080 is already in use, change the PORT in `backend/server.c` and recompile.

### Server Won't Start
Ensure you have proper permissions to bind to the port. On some systems, you may need to use a port above 1024.

### Flights Not Showing
Check the browser console for errors. The application uses mock data by default, so flights should always be visible.

## Future Enhancements

- [ ] Live API integration with major flight data providers
- [ ] Arrival board view
- [ ] Flight search functionality
- [ ] More detailed flight information
- [ ] Push notifications for flight status changes
- [ ] Historical flight data
- [ ] Weather information integration
- [ ] Multiple language support

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Created as a demonstration of C backend with modern web frontend.
