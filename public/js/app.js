// Flight Status Board Application
class FlightStatusBoard {
    constructor() {
        this.api = new FlightAPI();
        this.currentAirport = 'OSL';
        this.currentCountry = 'NO';
        this.refreshInterval = null;
        this.countries = [];
        this.airports = {};
        
        this.initializeElements();
        this.attachEventListeners();
        this.initialize();
    }

    initializeElements() {
        this.elements = {
            countrySelect: document.getElementById('country-select'),
            airportSelect: document.getElementById('airport-select'),
            refreshBtn: document.getElementById('refresh-btn'),
            retryBtn: document.getElementById('retry-btn'),
            statusText: document.getElementById('status-text'),
            lastUpdate: document.getElementById('last-update'),
            currentAirport: document.getElementById('current-airport'),
            flightCount: document.getElementById('flight-count'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('error-message'),
            flightsGrid: document.getElementById('flights-grid')
        };
    }

    attachEventListeners() {
        this.elements.countrySelect.addEventListener('change', () => this.onCountryChange());
        this.elements.airportSelect.addEventListener('change', () => this.onAirportChange());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshFlights());
        this.elements.retryBtn.addEventListener('click', () => this.refreshFlights());
    }

    async initialize() {
        try {
            // Load countries
            this.countries = await this.api.fetchCountries();
            
            // Load all airports
            for (const country of this.countries) {
                const airports = await this.api.fetchAirports(country.code);
                this.airports[country.code] = airports;
            }

            // Set default country and airport
            this.updateAirportSelector();
            
            // Load initial flights
            await this.refreshFlights();
            
            // NO auto-refresh - manual only
            
        } catch (error) {
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    onCountryChange() {
        this.currentCountry = this.elements.countrySelect.value;
        this.updateAirportSelector();
        this.refreshFlights();
    }

    updateAirportSelector() {
        const airports = this.airports[this.currentCountry] || [];
        this.elements.airportSelect.innerHTML = '';
        
        airports.forEach(airport => {
            const option = document.createElement('option');
            option.value = airport.code;
            option.textContent = `${airport.code} - ${airport.name}`;
            this.elements.airportSelect.appendChild(option);
        });

        if (airports.length > 0) {
            this.currentAirport = airports[0].code;
        }
    }

    onAirportChange() {
        this.currentAirport = this.elements.airportSelect.value;
        this.refreshFlights();
    }

    async refreshFlights() {
        try {
            this.showLoading();
            
            const data = await this.api.fetchFlights(this.currentAirport);
            
            this.displayFlights(data);
            this.updateStatus('Connected', data.timestamp);
            this.hideLoading();
            
        } catch (error) {
            this.showError('Failed to load flight data: ' + error.message);
            this.updateStatus('Error', null);
        }
    }

    displayFlights(data) {
        const { airport, flights, count } = data;
        
        // Update info
        this.elements.currentAirport.textContent = `${airport.code} - ${airport.name}`;
        this.elements.flightCount.textContent = count || 0;

        // Clear grid
        this.elements.flightsGrid.innerHTML = '';

        if (!flights || flights.length === 0) {
            this.elements.flightsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.7;">
                    <p style="font-size: 1.5rem; margin-bottom: 10px;">✈️</p>
                    <p>No flights detected in the ${airport.code} area</p>
                    <p style="font-size: 0.8rem; margin-top: 10px; opacity: 0.7;">
                        Try another airport or wait for aircraft to enter the monitoring zone
                    </p>
                </div>
            `;
            return;
        }

        // Display flights
        flights.forEach(flight => {
            const card = this.createFlightCard(flight);
            this.elements.flightsGrid.appendChild(card);
        });
    }

    createFlightCard(flight) {
        const card = document.createElement('div');
        card.className = 'flight-card';

        const statusClass = `status-${flight.status.toLowerCase().replace(' ', '-')}`;
        
        card.innerHTML = `
            <div class="flight-header">
                <div>
                    <div class="flight-callsign">${this.escapeHtml(flight.callsign)}</div>
                    <div class="flight-airline">Airline: ${this.escapeHtml(flight.airline)}</div>
                </div>
                <div class="flight-status ${statusClass}">
                    ${this.escapeHtml(flight.status)}
                </div>
            </div>
            <div class="flight-details">
                <div class="flight-detail">
                    <span class="detail-label">ICAO24:</span>
                    <span class="detail-value">${this.escapeHtml(flight.icao24)}</span>
                </div>
                <div class="flight-detail">
                    <span class="detail-label">Country:</span>
                    <span class="detail-value">${this.escapeHtml(flight.originCountry)}</span>
                </div>
                <div class="flight-detail">
                    <span class="detail-label">Altitude:</span>
                    <span class="detail-value">${flight.altitude} ft</span>
                </div>
                <div class="flight-detail">
                    <span class="detail-label">Speed:</span>
                    <span class="detail-value">${flight.velocity} kts</span>
                </div>
                <div class="flight-detail">
                    <span class="detail-label">Heading:</span>
                    <span class="detail-value">${flight.heading}°</span>
                </div>
                <div class="flight-detail">
                    <span class="detail-label">Vertical Rate:</span>
                    <span class="detail-value">${flight.verticalRate} m/s</span>
                </div>
                <div class="flight-detail">
                    <span class="detail-label">Position:</span>
                    <span class="detail-value">${flight.latitude?.toFixed(4)}, ${flight.longitude?.toFixed(4)}</span>
                </div>
                <div class="flight-detail">
                    <span class="detail-label">Last Contact:</span>
                    <span class="detail-value">${this.formatTime(flight.lastContact)}</span>
                </div>
            </div>
        `;

        return card;
    }

    showLoading() {
        this.elements.loading.style.display = 'block';
        this.elements.error.style.display = 'none';
        this.elements.flightsGrid.style.display = 'none';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
        this.elements.flightsGrid.style.display = 'grid';
    }

    showError(message) {
        this.elements.error.style.display = 'block';
        this.elements.errorMessage.textContent = message;
        this.elements.loading.style.display = 'none';
        this.elements.flightsGrid.style.display = 'none';
    }

    updateStatus(status, timestamp) {
        this.elements.statusText.textContent = status;
        if (timestamp) {
            const time = new Date(timestamp).toLocaleTimeString();
            this.elements.lastUpdate.textContent = `Last update: ${time}`;
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flightBoard = new FlightStatusBoard();
});
