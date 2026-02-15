// Mock flight data generator
const airlines = [
    'American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue',
    'Alaska Airlines', 'Spirit', 'Frontier', 'Hawaiian Airlines'
];

const destinations = {
    'JFK': ['LAX', 'ORD', 'MIA', 'SFO', 'BOS', 'ATL', 'DEN', 'SEA', 'LAS', 'PHX'],
    'LAX': ['JFK', 'ORD', 'MIA', 'SFO', 'BOS', 'ATL', 'DEN', 'SEA', 'LAS', 'PHX'],
    'ORD': ['JFK', 'LAX', 'MIA', 'SFO', 'BOS', 'ATL', 'DEN', 'SEA', 'LAS', 'PHX'],
    'ATL': ['JFK', 'LAX', 'ORD', 'MIA', 'SFO', 'BOS', 'DEN', 'SEA', 'LAS', 'PHX'],
    'DFW': ['JFK', 'LAX', 'ORD', 'MIA', 'SFO', 'BOS', 'ATL', 'DEN', 'SEA', 'LAS'],
    'DEN': ['JFK', 'LAX', 'ORD', 'MIA', 'SFO', 'BOS', 'ATL', 'SEA', 'LAS', 'PHX'],
    'SFO': ['JFK', 'LAX', 'ORD', 'MIA', 'BOS', 'ATL', 'DEN', 'SEA', 'LAS', 'PHX'],
    'SEA': ['JFK', 'LAX', 'ORD', 'MIA', 'SFO', 'BOS', 'ATL', 'DEN', 'LAS', 'PHX']
};

const statuses = ['On Time', 'Delayed', 'Boarding', 'Cancelled'];
const terminals = ['1', '2', '3', '4', '5', 'A', 'B', 'C', 'D'];
const gates = Array.from({length: 50}, (_, i) => String(i + 1));

let currentAirport = 'JFK';
let currentFilter = 'all';
let flights = [];
let refreshInterval;
let countdownInterval;
let refreshCounter = 60;

// Initialize the application
function init() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    generateFlights();
    displayFlights();
    
    startAutoRefresh();
}

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    document.getElementById('currentTime').textContent = timeString;
}

// Generate random flight time
function generateRandomTime(baseHour = null) {
    const now = new Date();
    const hour = baseHour !== null ? baseHour : Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    
    const time = new Date(now);
    time.setHours(hour, minute, 0, 0);
    
    return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Generate mock flights
function generateFlights() {
    flights = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate 20-30 flights
    const numFlights = Math.floor(Math.random() * 11) + 20;
    
    for (let i = 0; i < numFlights; i++) {
        const isDeparture = Math.random() > 0.5;
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const airlineCode = airline.substring(0, 2).toUpperCase();
        const flightNumber = `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`;
        
        const destinationList = destinations[currentAirport] || destinations['JFK'];
        const destination = destinationList[Math.floor(Math.random() * destinationList.length)];
        
        // Generate time within +/- 3 hours of current time
        const hourOffset = Math.floor(Math.random() * 7) - 3;
        const scheduledHour = (currentHour + hourOffset + 24) % 24;
        const scheduledTime = generateRandomTime(scheduledHour);
        
        // Generate expected time (might be delayed)
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        let expectedTime = scheduledTime;
        
        if (status === 'Delayed') {
            const delayMinutes = Math.floor(Math.random() * 90) + 15;
            const [hours, minutes] = scheduledTime.split(':');
            const scheduled = new Date();
            scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            scheduled.setMinutes(scheduled.getMinutes() + delayMinutes);
            expectedTime = scheduled.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
        
        flights.push({
            flightNumber,
            airline,
            destination,
            scheduledTime,
            expectedTime,
            status,
            terminal: terminals[Math.floor(Math.random() * terminals.length)],
            gate: gates[Math.floor(Math.random() * gates.length)],
            type: isDeparture ? 'departure' : 'arrival'
        });
    }
    
    // Sort flights by scheduled time
    flights.sort((a, b) => {
        const timeA = a.scheduledTime.split(':').map(Number);
        const timeB = b.scheduledTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
}

// Display flights in the table
function displayFlights() {
    const tbody = document.getElementById('flightTableBody');
    tbody.innerHTML = '';
    
    const filteredFlights = flights.filter(flight => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'departures') return flight.type === 'departure';
        if (currentFilter === 'arrivals') return flight.type === 'arrival';
        return true;
    });
    
    filteredFlights.forEach(flight => {
        const row = document.createElement('tr');
        
        const statusClass = flight.status.toLowerCase().replace(' ', '-');
        const destinationType = flight.type === 'departure' ? 'To' : 'From';
        
        row.innerHTML = `
            <td class="flight-number">${flight.flightNumber}</td>
            <td class="airline">${flight.airline}</td>
            <td class="destination">${destinationType} ${flight.destination}</td>
            <td>${flight.scheduledTime}</td>
            <td>${flight.expectedTime}</td>
            <td><span class="status ${statusClass}">${flight.status}</span></td>
            <td>${flight.terminal}</td>
            <td>${flight.gate}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Change airport
function changeAirport() {
    const select = document.getElementById('airport');
    currentAirport = select.value;
    generateFlights();
    displayFlights();
    resetRefreshCounter();
}

// Filter flights
function filterFlights(filter) {
    currentFilter = filter;
    
    // Update active tab
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    displayFlights();
}

// Auto-refresh functionality
function startAutoRefresh() {
    // Refresh flights every 60 seconds
    refreshInterval = setInterval(() => {
        generateFlights();
        displayFlights();
        resetRefreshCounter();
    }, 60000);
    
    // Update countdown every second
    countdownInterval = setInterval(() => {
        refreshCounter--;
        document.getElementById('refreshCounter').textContent = refreshCounter;
        
        if (refreshCounter <= 0) {
            refreshCounter = 60;
        }
    }, 1000);
}

// Reset refresh counter
function resetRefreshCounter() {
    refreshCounter = 60;
    document.getElementById('refreshCounter').textContent = refreshCounter;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
