// Mock flight data
const flights = [
    {
        flight: 'BA142',
        airline: 'British Airways',
        type: 'departure',
        destination: 'London Heathrow',
        scheduled: '14:30',
        expected: '14:30',
        gate: 'A12',
        status: 'on-time'
    },
    {
        flight: 'UA856',
        airline: 'United Airlines',
        type: 'arrival',
        destination: 'New York JFK',
        scheduled: '15:45',
        expected: '16:10',
        gate: 'B7',
        status: 'delayed'
    },
    {
        flight: 'LH401',
        airline: 'Lufthansa',
        type: 'departure',
        destination: 'Frankfurt',
        scheduled: '16:00',
        expected: '16:00',
        gate: 'C3',
        status: 'boarding'
    },
    {
        flight: 'AF234',
        airline: 'Air France',
        type: 'arrival',
        destination: 'Paris CDG',
        scheduled: '14:15',
        expected: '14:20',
        gate: 'A5',
        status: 'landed'
    },
    {
        flight: 'EK019',
        airline: 'Emirates',
        type: 'departure',
        destination: 'Dubai',
        scheduled: '17:30',
        expected: '17:30',
        gate: 'D11',
        status: 'on-time'
    },
    {
        flight: 'SQ317',
        airline: 'Singapore Airlines',
        type: 'arrival',
        destination: 'Singapore',
        scheduled: '13:45',
        expected: '13:45',
        gate: 'B12',
        status: 'departed'
    },
    {
        flight: 'QF1',
        airline: 'Qantas',
        type: 'departure',
        destination: 'Sydney',
        scheduled: '18:00',
        expected: '18:00',
        gate: 'E8',
        status: 'on-time'
    },
    {
        flight: 'DL456',
        airline: 'Delta Airlines',
        type: 'arrival',
        destination: 'Atlanta',
        scheduled: '15:20',
        expected: '15:20',
        gate: 'A9',
        status: 'on-time'
    },
    {
        flight: 'AC890',
        airline: 'Air Canada',
        type: 'departure',
        destination: 'Toronto',
        scheduled: '14:50',
        expected: '15:30',
        gate: 'C6',
        status: 'delayed'
    },
    {
        flight: 'NH109',
        airline: 'ANA',
        type: 'arrival',
        destination: 'Tokyo',
        scheduled: '16:30',
        expected: '—',
        gate: 'D4',
        status: 'cancelled'
    },
    {
        flight: 'KL642',
        airline: 'KLM',
        type: 'departure',
        destination: 'Amsterdam',
        scheduled: '19:15',
        expected: '19:15',
        gate: 'B15',
        status: 'on-time'
    },
    {
        flight: 'IB3154',
        airline: 'Iberia',
        type: 'arrival',
        destination: 'Madrid',
        scheduled: '14:00',
        expected: '14:05',
        gate: 'C9',
        status: 'boarding'
    }
];

// Current filter
let currentFilter = 'all';

// Initialize the application
function init() {
    updateCurrentTime();
    renderFlights();
    setupFilterButtons();
    
    // Update time every second
    setInterval(updateCurrentTime, 1000);
    
    // Simulate live updates every 30 seconds
    setInterval(simulateLiveUpdate, 30000);
}

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('currentTime').textContent = `${dateString} • ${timeString}`;
}

// Render flights to the table
function renderFlights() {
    const tbody = document.getElementById('flightTableBody');
    tbody.innerHTML = '';
    
    const filteredFlights = currentFilter === 'all' 
        ? flights 
        : flights.filter(flight => {
            if (currentFilter === 'departures') return flight.type === 'departure';
            if (currentFilter === 'arrivals') return flight.type === 'arrival';
            return true;
        });
    
    filteredFlights.forEach(flight => {
        const row = createFlightRow(flight);
        tbody.appendChild(row);
    });
}

// Create a flight row element
function createFlightRow(flight) {
    const row = document.createElement('tr');
    
    const typeLabel = flight.type === 'departure' ? 'Departure' : 'Arrival';
    const typeClass = flight.type === 'departure' ? 'type-departure' : 'type-arrival';
    
    row.innerHTML = `
        <td><span class="flight-number">${flight.flight}</span></td>
        <td><span class="airline">${flight.airline}</span></td>
        <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
        <td>${flight.destination}</td>
        <td>${flight.scheduled}</td>
        <td>${flight.expected}</td>
        <td>${flight.gate}</td>
        <td><span class="status status-${flight.status.replace(' ', '-')}">${formatStatus(flight.status)}</span></td>
    `;
    
    return row;
}

// Format status text
function formatStatus(status) {
    return status.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Setup filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update current filter
            currentFilter = button.dataset.filter;
            
            // Re-render flights
            renderFlights();
        });
    });
}

// Simulate live updates
function simulateLiveUpdate() {
    // Randomly update some flight statuses or times
    const randomFlight = flights[Math.floor(Math.random() * flights.length)];
    
    // Only update if not cancelled or departed/landed
    if (randomFlight.status !== 'cancelled' && 
        randomFlight.status !== 'departed' && 
        randomFlight.status !== 'landed') {
        
        const possibleStatuses = ['on-time', 'delayed', 'boarding'];
        const randomStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
        randomFlight.status = randomStatus;
        
        // If delayed, update expected time
        if (randomStatus === 'delayed') {
            const [hours, minutes] = randomFlight.scheduled.split(':');
            const delayMinutes = Math.floor(Math.random() * 30) + 10;
            const expectedTime = new Date();
            expectedTime.setHours(parseInt(hours));
            expectedTime.setMinutes(parseInt(minutes) + delayMinutes);
            randomFlight.expected = expectedTime.toTimeString().slice(0, 5);
        } else {
            randomFlight.expected = randomFlight.scheduled;
        }
        
        renderFlights();
    }
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
