// Global variables
let currentAirport = 'JFK';
let refreshInterval;
let countdownInterval;
const REFRESH_SECONDS = 30;

// Format time from ISO string
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Get status class name
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('on time')) return 'status-on-time';
    if (statusLower.includes('delayed')) return 'status-delayed';
    if (statusLower.includes('boarding')) return 'status-boarding';
    if (statusLower.includes('cancelled')) return 'status-cancelled';
    return '';
}

// Render flight data
function renderFlights(flights) {
    const flightListLeft = document.getElementById('flightListLeft');
    const flightListRight = document.getElementById('flightListRight');
    
    if (!flights || flights.length === 0) {
        flightListLeft.innerHTML = '<div class="loading">No flights available</div>';
        flightListRight.innerHTML = '';
        return;
    }
    
    // Split flights into two columns: first 10 and last 10
    const leftFlights = flights.slice(0, 10);
    const rightFlights = flights.slice(10, 20);
    
    // Render left column
    let htmlLeft = '';
    leftFlights.forEach(flight => {
        htmlLeft += renderFlightRow(flight);
    });
    flightListLeft.innerHTML = htmlLeft;
    
    // Render right column
    let htmlRight = '';
    rightFlights.forEach(flight => {
        htmlRight += renderFlightRow(flight);
    });
    flightListRight.innerHTML = htmlRight || '<div class="loading">No more flights</div>';
    
    updateLastUpdateTime();
}

// Helper function to render a single flight row
function renderFlightRow(flight) {
    const statusClass = getStatusClass(flight.status);
    const time = formatTime(flight.scheduled_time);
    const estimatedTime = flight.estimated_time ? formatTime(flight.estimated_time) : time;
    
    return `
        <div class="flight-row">
            <div class="col-time">
                ${time}
                ${flight.delay_minutes > 0 ? `<div class="delay-info">Est: ${estimatedTime}</div>` : ''}
            </div>
            <div class="col-flight">${flight.flight_number}</div>
            <div class="col-airline">${flight.airline}</div>
            <div class="col-destination">${flight.destination}</div>
            <div class="col-terminal">${flight.terminal || '-'}</div>
            <div class="col-gate">${flight.gate || '-'}</div>
            <div class="col-status ${statusClass}">
                ${flight.status}
                ${flight.delay_minutes > 0 ? `<div class="delay-info">+${flight.delay_minutes} min</div>` : ''}
            </div>
        </div>
    `;
}

// Fetch flight data from API
async function fetchFlights() {
    try {
        const response = await fetch(`/api/flights?airport=${currentAirport}`);
        if (!response.ok) {
            throw new Error('Failed to fetch flight data');
        }
        const flights = await response.json();
        renderFlights(flights);
    } catch (error) {
        console.error('Error fetching flights:', error);
        document.getElementById('flightListLeft').innerHTML = 
            '<div class="loading">Error loading flight data. Please try again.</div>';
        document.getElementById('flightListRight').innerHTML = '';
    }
}

// Update last update timestamp
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US');
    document.getElementById('lastUpdate').textContent = timeString;
}

// Change airport
function changeAirport() {
    const select = document.getElementById('airport');
    currentAirport = select.value;
    
    // Clear existing intervals
    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    
    // Fetch new data and restart intervals
    fetchFlights();
    startAutoRefresh();
}

// Countdown timer
function startCountdown() {
    let seconds = REFRESH_SECONDS;
    const countdownElement = document.getElementById('countdown');
    
    countdownInterval = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        
        if (seconds <= 0) {
            seconds = REFRESH_SECONDS;
        }
    }, 1000);
}

// Start auto-refresh
function startAutoRefresh() {
    startCountdown();
    refreshInterval = setInterval(() => {
        fetchFlights();
        // Reset countdown
        clearInterval(countdownInterval);
        startCountdown();
    }, REFRESH_SECONDS * 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    fetchFlights();
    
    // Start auto-refresh
    startAutoRefresh();
    
    console.log('Flight Status Board initialized');
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
});
