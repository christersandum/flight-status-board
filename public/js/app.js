// Flight Information Display System
class FlightStatusBoard {
    constructor() {
        this.api = new FlightAPI();
        this.currentAirport = 'OSL';
        this.currentCountry = 'NO';
        this.currentTab = 'departures';
        this.refreshInterval = null;
        this.clockInterval = null;
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
            airportName: document.getElementById('airport-name'),
            digitalClock: document.getElementById('digital-clock'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('error-message'),
            departuresView: document.getElementById('departures-view'),
            arrivalsView: document.getElementById('arrivals-view'),
            departuresTbody: document.getElementById('departures-tbody'),
            arrivalsTbody: document.getElementById('arrivals-tbody'),
            tabBtns: document.querySelectorAll('.tab-btn')
        };
    }

    attachEventListeners() {
        this.elements.countrySelect.addEventListener('change', () => this.onCountryChange());
        this.elements.airportSelect.addEventListener('change', () => this.onAirportChange());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshFlights());
        this.elements.retryBtn.addEventListener('click', () => this.refreshFlights());
        
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    async initialize() {
        try {
            // Start the digital clock
            this.startClock();
            
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
            
            // Start auto-refresh (120 seconds)
            this.startAutoRefresh();
            
        } catch (error) {
            this.showError('FAILED TO INITIALIZE APPLICATION: ' + error.message);
        }
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            this.elements.digitalClock.textContent = `${hours}:${minutes}:${seconds}`;
        };
        
        updateClock();
        this.clockInterval = setInterval(updateClock, 1000);
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        this.elements.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show/hide views
        if (tab === 'departures') {
            this.elements.departuresView.style.display = 'block';
            this.elements.arrivalsView.style.display = 'none';
        } else {
            this.elements.departuresView.style.display = 'none';
            this.elements.arrivalsView.style.display = 'block';
        }
        
        // Refresh data for the active tab
        this.refreshFlights();
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
            option.textContent = `${airport.code} - ${airport.name.toUpperCase()}`;
            this.elements.airportSelect.appendChild(option);
        });

        if (airports.length > 0) {
            this.currentAirport = airports[0].code;
            this.elements.airportName.textContent = airports[0].name.toUpperCase();
        }
    }

    onAirportChange() {
        this.currentAirport = this.elements.airportSelect.value;
        const airports = this.airports[this.currentCountry] || [];
        const airport = airports.find(a => a.code === this.currentAirport);
        if (airport) {
            this.elements.airportName.textContent = airport.name.toUpperCase();
        }
        this.refreshFlights();
    }

    async refreshFlights() {
        try {
            this.showLoading();
            
            if (this.currentTab === 'departures') {
                const data = await this.api.fetchDepartures(this.currentAirport);
                this.displayDepartures(data);
            } else {
                const data = await this.api.fetchArrivals(this.currentAirport);
                this.displayArrivals(data);
            }
            
            this.updateStatus('CONNECTED', new Date().toISOString());
            this.hideLoading();
            
        } catch (error) {
            this.showError('FAILED TO LOAD FLIGHT DATA: ' + error.message);
            this.updateStatus('ERROR', null);
        }
    }

    displayDepartures(data) {
        const { flights } = data;
        
        // Clear table
        this.elements.departuresTbody.innerHTML = '';

        if (!flights || flights.length === 0) {
            this.elements.departuresTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="empty-state-icon">✈️</div>
                        <div class="empty-state-text">NO DEPARTURES FOUND</div>
                        <div class="empty-state-subtext">No departures in the last 2 hours</div>
                    </td>
                </tr>
            `;
            return;
        }

        // Display flights
        flights.forEach(flight => {
            const row = this.createDepartureRow(flight);
            this.elements.departuresTbody.appendChild(row);
        });
    }

    displayArrivals(data) {
        const { flights } = data;
        
        // Clear table
        this.elements.arrivalsTbody.innerHTML = '';

        if (!flights || flights.length === 0) {
            this.elements.arrivalsTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="empty-state-icon">✈️</div>
                        <div class="empty-state-text">NO ARRIVALS FOUND</div>
                        <div class="empty-state-subtext">No arrivals in the last 2 hours</div>
                    </td>
                </tr>
            `;
            return;
        }

        // Display flights
        flights.forEach(flight => {
            const row = this.createArrivalRow(flight);
            this.elements.arrivalsTbody.appendChild(row);
        });
    }

    createDepartureRow(flight) {
        const row = document.createElement('tr');
        
        const time = this.formatTime(flight.firstSeen);
        const statusClass = this.getStatusClass(flight.status);
        
        row.innerHTML = `
            <td>${time}</td>
            <td>${this.escapeHtml(flight.callsign)}</td>
            <td>${this.escapeHtml(flight.estArrivalAirportName)}</td>
            <td>${this.escapeHtml(flight.gate)}</td>
            <td><span class="status-badge ${statusClass}">${this.escapeHtml(flight.status)}</span></td>
        `;
        
        return row;
    }

    createArrivalRow(flight) {
        const row = document.createElement('tr');
        
        const time = this.formatTime(flight.lastSeen);
        const statusClass = this.getStatusClass(flight.status);
        
        row.innerHTML = `
            <td>${time}</td>
            <td>${this.escapeHtml(flight.callsign)}</td>
            <td>${this.escapeHtml(flight.estDepartureAirportName)}</td>
            <td>${this.escapeHtml(flight.gate)}</td>
            <td><span class="status-badge ${statusClass}">${this.escapeHtml(flight.status)}</span></td>
        `;
        
        return row;
    }

    getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
    }

    showLoading() {
        this.elements.loading.style.display = 'block';
        this.elements.error.style.display = 'none';
        this.elements.departuresView.style.display = 'none';
        this.elements.arrivalsView.style.display = 'none';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
        if (this.currentTab === 'departures') {
            this.elements.departuresView.style.display = 'block';
        } else {
            this.elements.arrivalsView.style.display = 'block';
        }
    }

    showError(message) {
        this.elements.error.style.display = 'block';
        this.elements.errorMessage.textContent = message;
        this.elements.loading.style.display = 'none';
        this.elements.departuresView.style.display = 'none';
        this.elements.arrivalsView.style.display = 'none';
    }

    updateStatus(status, timestamp) {
        this.elements.statusText.textContent = status;
        if (timestamp) {
            const time = new Date(timestamp).toLocaleTimeString();
            this.elements.lastUpdate.textContent = `LAST UPDATE: ${time}`;
        }
    }

    startAutoRefresh() {
        // Clear any existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Refresh every 120 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshFlights();
        }, 120000);
    }

    formatTime(timestamp) {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp * 1000);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flightBoard = new FlightStatusBoard();
});
