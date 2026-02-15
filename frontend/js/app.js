// Application constants
const AUTO_REFRESH_INTERVAL_MS = 60000; // 60 seconds
const MAX_FLIGHTS_DISPLAY = 20; // Maximum flights to show

// Application state
const state = {
    countries: [],
    airports: [],
    flights: [],
    selectedCountry: 'NO',
    selectedAirport: 'ENGM',
    autoRefreshInterval: null
};

// DOM elements
const elements = {
    countrySelect: document.getElementById('country-select'),
    airportSelect: document.getElementById('airport-select'),
    refreshBtn: document.getElementById('refresh-btn'),
    flightsContainer: document.getElementById('flights-container'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    lastUpdated: document.getElementById('last-updated')
};

// Format time string
function formatTime(timeStr) {
    return timeStr || 'N/A';
}

// Get status class for styling
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('on time')) return 'status-on-time';
    if (statusLower.includes('delayed')) return 'status-delayed';
    if (statusLower.includes('boarding')) return 'status-boarding';
    if (statusLower.includes('departed')) return 'status-departed';
    if (statusLower.includes('cancelled')) return 'status-cancelled';
    return 'status-on-time';
}

// Create flight card HTML
function createFlightCard(flight) {
    return `
        <div class="flight-card">
            <div class="flight-header">
                <div class="flight-time">${formatTime(flight.departure_time)}</div>
                <div class="flight-number">${flight.flight_number}</div>
            </div>
            <div class="flight-info">
                <div class="flight-airline">${flight.airline}</div>
                <div class="flight-destination">→ ${flight.destination}</div>
            </div>
            <div class="flight-details">
                <div class="detail-item">
                    <span class="detail-label">Terminal</span>
                    <span class="detail-value">${flight.terminal || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Gate</span>
                    <span class="detail-value">${flight.gate || 'N/A'}</span>
                </div>
            </div>
            <div class="flight-status ${getStatusClass(flight.status)}">
                ${flight.status}
            </div>
        </div>
    `;
}

// Render flights
function renderFlights(flights) {
    if (!flights || flights.length === 0) {
        elements.flightsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h2>No flights available</h2>
                <p>Please select a different airport or try again later.</p>
            </div>
        `;
        return;
    }

    elements.flightsContainer.innerHTML = flights
        .slice(0, MAX_FLIGHTS_DISPLAY)  // Limit to configured max flights
        .map(flight => createFlightCard(flight))
        .join('');
}

// Show loading state
function showLoading() {
    elements.loading.style.display = 'block';
    elements.error.style.display = 'none';
    elements.flightsContainer.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    elements.loading.style.display = 'none';
    elements.flightsContainer.style.display = 'grid';
}

// Show error state
function showError(message) {
    elements.error.style.display = 'block';
    elements.error.querySelector('p').textContent = message || 'Failed to load data. Please try again.';
    elements.loading.style.display = 'none';
    elements.flightsContainer.style.display = 'none';
}

// Update last updated time
function updateLastUpdatedTime() {
    const now = new Date();
    elements.lastUpdated.textContent = now.toLocaleTimeString();
}

// Load countries
async function loadCountries() {
    try {
        const countries = await window.FlightAPI.getCountries();
        state.countries = countries;

        elements.countrySelect.innerHTML = countries
            .map(country => `<option value="${country.code}" ${country.code === state.selectedCountry ? 'selected' : ''}>
                ${country.name}
            </option>`)
            .join('');
        
        // Load airports for default country
        await loadAirports(state.selectedCountry);
    } catch (error) {
        console.error('Failed to load countries:', error);
        showError('Failed to load countries. Please refresh the page.');
    }
}

// Load airports for a country
async function loadAirports(countryCode) {
    try {
        const airports = await window.FlightAPI.getAirports(countryCode);
        state.airports = airports;

        if (airports.length === 0) {
            elements.airportSelect.innerHTML = '<option value="">No airports available</option>';
            return;
        }

        elements.airportSelect.innerHTML = airports
            .map(airport => `<option value="${airport.icao}" ${airport.icao === state.selectedAirport ? 'selected' : ''}>
                ${airport.name} (${airport.iata})
            </option>`)
            .join('');
        
        // If current selected airport is not in the new list, select the first one
        const airportExists = airports.some(a => a.icao === state.selectedAirport);
        if (!airportExists && airports.length > 0) {
            state.selectedAirport = airports[0].icao;
            elements.airportSelect.value = state.selectedAirport;
        }
        
        // Load flights for the selected airport
        await loadFlights(state.selectedAirport);
    } catch (error) {
        console.error('Failed to load airports:', error);
        showError('Failed to load airports. Please try again.');
    }
}

// Load flights for an airport
async function loadFlights(airportCode) {
    if (!airportCode) {
        showError('Please select an airport.');
        return;
    }

    showLoading();
    
    try {
        const flights = await window.FlightAPI.getFlights(airportCode);
        state.flights = flights;
        renderFlights(flights);
        hideLoading();
        updateLastUpdatedTime();
    } catch (error) {
        console.error('Failed to load flights:', error);
        showError('Failed to load flight data. Please try again.');
    }
}

// Setup auto-refresh
function setupAutoRefresh() {
    // Clear existing interval if any
    if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
    }
    
    // Refresh every configured interval
    state.autoRefreshInterval = setInterval(() => {
        if (state.selectedAirport) {
            loadFlights(state.selectedAirport);
        }
    }, AUTO_REFRESH_INTERVAL_MS);
}

// Event listeners
function setupEventListeners() {
    // Country selection change
    elements.countrySelect.addEventListener('change', async (e) => {
        state.selectedCountry = e.target.value;
        await loadAirports(state.selectedCountry);
    });

    // Airport selection change
    elements.airportSelect.addEventListener('change', async (e) => {
        state.selectedAirport = e.target.value;
        await loadFlights(state.selectedAirport);
    });

    // Refresh button
    elements.refreshBtn.addEventListener('click', () => {
        if (state.selectedAirport) {
            loadFlights(state.selectedAirport);
        }
    });
}

// Initialize application
async function init() {
    console.log('Initializing Flight Status Board...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadCountries();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    console.log('Flight Status Board initialized successfully');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
