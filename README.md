# Flight Status Board ✈️

A real-time flight status board application with a C backend server and modern web frontend. Displays flight information in an airport-style interface with automatic updates.

**✨ Now with FREE real flight data via AviationStack API! (No credit card required)**

![Flight Status Board in Browser](https://github.com/user-attachments/assets/4d5f0ccd-6fe4-47e8-ae99-149edfd8b96f)

## 🚀 Quick Start - How to Use in Browser

**Three simple steps to get started:**

1. **Build the server:**
   ```bash
   make
   ```

2. **Start the server:**
   ```bash
   ./flight-server
   ```
   or
   ```bash
   make run
   ```

3. **Open in your browser:**
   ```
   http://localhost:8080
   ```

That's it! The flight status board will load in your browser showing flight departures in a beautiful airport-style display. Use the dropdown menu to select different airports.

**📝 Note:** The application uses mock data by default. To get real flight data, see the [API Integration](#api-integration-free) section below.

---

## Features

- 🛫 **Real-time flight status** display (20 flights)
- 🆓 **FREE API integration** - Get actual flight data from AviationStack (500-1000 requests/month free)
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
- HTTP server using libcurl for API requests
- RESTful API endpoints
- **Real flight data integration** via AviationStack API (free tier)
- JSON parsing and transformation
- Static file serving
- Automatic fallback to mock data

### Frontend (HTML/CSS/JavaScript)
- Vanilla JavaScript (no frameworks)
- Modern CSS Grid layout
- Responsive design
- Real-time updates every 30 seconds

## Prerequisites

- GCC compiler (or any C compiler)
- libcurl development files (`libcurl4-openssl-dev` on Ubuntu/Debian)
- Make (optional, for easy building)
- A modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/christersandum/flight-status-board.git
cd flight-status-board
```

2. Install dependencies (if needed):
```bash
# On Ubuntu/Debian:
sudo apt-get install libcurl4-openssl-dev

# On macOS with Homebrew:
brew install curl

# On Fedora/RHEL:
sudo dnf install libcurl-devel
```

3. Build the server:
```bash
make
```

Or compile manually:
```bash
gcc -Wall -Wextra -std=c99 -o flight-server backend/server.c -lcurl
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

## API Integration (FREE!)

The application now integrates with **AviationStack's free tier API** - no credit card required!

### Getting Real Flight Data - Free Setup

1. **Sign up for a free AviationStack account**:
   - Visit [https://aviationstack.com/product](https://aviationstack.com/product)
   - Create a free account (no credit card needed)
   - Get your free API key (500-1000 requests/month)

2. **Add your API key to `config.txt`**:
```
API_KEY=your_aviationstack_api_key_here
```

3. **Restart the server** - it will now fetch real flight data!

### Free Tier Features
- ✅ **500-1000 API requests per month** (free forever)
- ✅ **Real-time flight data** for departures and arrivals
- ✅ **Worldwide coverage** - all major airports
- ✅ **No credit card required**
- ✅ **Flight status**, delays, gates, terminals
- ✅ **Automatic fallback** to mock data if API limit reached

**Note:** Without an API key, the application uses mock data for demonstration purposes.

### Alternative Free APIs

You can also use other free flight APIs by modifying the code:
   - [OpenSky Network](https://openskynetwork.github.io/opensky-api/) - Completely free and open
   - [ADS-B Exchange](https://www.adsbexchange.com/data/) - Community-powered, free access
   - [FlightAware (AeroAPI)](https://flightaware.com/commercial/flightxml/) - Freemium model

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

### Cannot Access http://localhost:8080
- **Make sure the server is running**: You should see "Flight Status Board Server running on http://localhost:8080" in your terminal
- **Check if the port is available**: Run `netstat -an | grep 8080` to see if something else is using port 8080
- **Try a different browser**: Sometimes browser cache can cause issues; try Chrome, Firefox, or Safari
- **Check firewall**: Ensure your firewall allows connections to localhost:8080

### Port Already in Use
If port 8080 is already in use, change the PORT in `backend/server.c` and recompile:
```c
#define PORT 8080  // Change to another port like 8081
```

### Server Won't Start
Ensure you have proper permissions to bind to the port. On some systems, you may need to use a port above 1024.

### Build Errors
If you get compilation errors:
- **Missing libcurl**: Install with `sudo apt-get install libcurl4-openssl-dev` (Ubuntu/Debian)
- **Missing gcc**: Install with `sudo apt-get install build-essential`

### Flights Not Showing
- Check the browser console for errors (F12 or right-click → Inspect)
- The application uses mock data by default, so flights should always be visible
- Try refreshing the page (Ctrl+R or Cmd+R)
- Check that `/api/flights` endpoint works: `curl http://localhost:8080/api/flights`

### Browser Shows "Cannot Connect"
- Verify the server is actually running: `ps aux | grep flight-server`
- Check server output in the terminal for any error messages
- Try stopping and restarting the server

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
