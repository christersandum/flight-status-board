// API Communication Layer
class FlightAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    async fetchCountries() {
        try {
            const response = await fetch(`${this.baseURL}/api/countries`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching countries:', error);
            throw error;
        }
    }

    async fetchAirports(countryCode = null) {
        try {
            const url = countryCode 
                ? `${this.baseURL}/api/airports?country=${countryCode}`
                : `${this.baseURL}/api/airports`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching airports:', error);
            throw error;
        }
    }

    async fetchFlights(airportCode) {
        try {
            const response = await fetch(`${this.baseURL}/api/flights?airport=${airportCode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching flights:', error);
            throw error;
        }
    }

    async fetchDepartures(airportCode) {
        try {
            const response = await fetch(`${this.baseURL}/api/departures?airport=${airportCode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching departures:', error);
            throw error;
        }
    }

    async fetchArrivals(airportCode) {
        try {
            const response = await fetch(`${this.baseURL}/api/arrivals?airport=${airportCode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching arrivals:', error);
            throw error;
        }
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error checking health:', error);
            throw error;
        }
    }
}

// Export for use in app.js
window.FlightAPI = FlightAPI;
