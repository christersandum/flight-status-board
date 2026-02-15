// Mock flight data for different airports
const flightData = {
    KJFK: [
        { flight: 'AA101', airline: 'American Airlines', destination: 'London (LHR)', time: '10:30', terminal: '8', gate: 'B22', status: 'On Time' },
        { flight: 'DL245', airline: 'Delta', destination: 'Paris (CDG)', time: '11:15', terminal: '4', gate: 'A15', status: 'Boarding' },
        { flight: 'UA892', airline: 'United', destination: 'Tokyo (NRT)', time: '12:45', terminal: '7', gate: 'C31', status: 'Delayed' },
        { flight: 'BA178', airline: 'British Airways', destination: 'Madrid (MAD)', time: '13:20', terminal: '8', gate: 'B18', status: 'On Time' },
        { flight: 'AF007', airline: 'Air France', destination: 'Rome (FCO)', time: '14:00', terminal: '1', gate: 'A8', status: 'On Time' },
        { flight: 'LH404', airline: 'Lufthansa', destination: 'Frankfurt (FRA)', time: '15:30', terminal: '1', gate: 'A12', status: 'Cancelled' }
    ],
    KLAX: [
        { flight: 'AA302', airline: 'American Airlines', destination: 'New York (JFK)', time: '09:00', terminal: '4', gate: '42A', status: 'Boarding' },
        { flight: 'UA715', airline: 'United', destination: 'San Francisco (SFO)', time: '10:45', terminal: '7', gate: '71B', status: 'On Time' },
        { flight: 'DL1588', airline: 'Delta', destination: 'Seattle (SEA)', time: '11:30', terminal: '5', gate: '53A', status: 'On Time' },
        { flight: 'AS321', airline: 'Alaska Airlines', destination: 'Portland (PDX)', time: '12:15', terminal: '6', gate: '62C', status: 'Delayed' },
        { flight: 'WN1234', airline: 'Southwest', destination: 'Las Vegas (LAS)', time: '13:00', terminal: '1', gate: '12', status: 'On Time' }
    ],
    KORD: [
        { flight: 'UA456', airline: 'United', destination: 'Denver (DEN)', time: '08:30', terminal: '1', gate: 'C18', status: 'On Time' },
        { flight: 'AA789', airline: 'American Airlines', destination: 'Miami (MIA)', time: '09:45', terminal: '3', gate: 'H12', status: 'Boarding' },
        { flight: 'DL902', airline: 'Delta', destination: 'Atlanta (ATL)', time: '10:20', terminal: '2', gate: 'E7', status: 'On Time' },
        { flight: 'UA1122', airline: 'United', destination: 'Los Angeles (LAX)', time: '11:50', terminal: '1', gate: 'C22', status: 'Delayed' },
        { flight: 'WN567', airline: 'Southwest', destination: 'Phoenix (PHX)', time: '13:15', terminal: '5', gate: 'B4', status: 'On Time' },
        { flight: 'F9888', airline: 'Frontier', destination: 'Orlando (MCO)', time: '14:30', terminal: '5', gate: 'B9', status: 'Cancelled' }
    ],
    KDFW: [
        { flight: 'AA1001', airline: 'American Airlines', destination: 'Boston (BOS)', time: '07:45', terminal: 'A', gate: 'A17', status: 'On Time' },
        { flight: 'AA1205', airline: 'American Airlines', destination: 'Chicago (ORD)', time: '09:00', terminal: 'A', gate: 'A23', status: 'Boarding' },
        { flight: 'UA334', airline: 'United', destination: 'Houston (IAH)', time: '10:15', terminal: 'E', gate: 'E12', status: 'On Time' },
        { flight: 'DL1678', airline: 'Delta', destination: 'Detroit (DTW)', time: '11:30', terminal: 'E', gate: 'E18', status: 'On Time' },
        { flight: 'WN2234', airline: 'Southwest', destination: 'Austin (AUS)', time: '12:45', terminal: 'B', gate: 'B15', status: 'Delayed' }
    ]
};

// Get status CSS class based on status text
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('on time')) return 'status-on-time';
    if (statusLower.includes('delayed')) return 'status-delayed';
    if (statusLower.includes('cancelled')) return 'status-cancelled';
    if (statusLower.includes('boarding')) return 'status-boarding';
    return '';
}

// Display flights for the selected airport
function displayFlights(airportCode) {
    const tbody = document.getElementById('flightTableBody');
    tbody.innerHTML = '';

    const flights = flightData[airportCode] || [];
    
    flights.forEach(flight => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(flight.status);
        
        row.innerHTML = `
            <td>${flight.flight}</td>
            <td>${flight.airline}</td>
            <td>${flight.destination}</td>
            <td>${flight.time}</td>
            <td>${flight.terminal}</td>
            <td>${flight.gate}</td>
            <td><span class="status ${statusClass}">${flight.status.toUpperCase()}</span></td>
        `;
        
        tbody.appendChild(row);
    });

    updateLastUpdateTime();
}

// Update the last update timestamp
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    const dateString = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    document.getElementById('lastUpdate').textContent = `Last Updated: ${dateString} ${timeString}`;
}

// Initialize the board
function initBoard() {
    const airportSelect = document.getElementById('airport');
    
    // Display initial flights for KJFK
    displayFlights('KJFK');
    
    // Add event listener for airport selection
    airportSelect.addEventListener('change', function() {
        displayFlights(this.value);
    });
    
    // Auto-refresh every 60 seconds
    setInterval(() => {
        const currentAirport = airportSelect.value;
        displayFlights(currentAirport);
    }, 60000);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBoard);
} else {
    initBoard();
}
