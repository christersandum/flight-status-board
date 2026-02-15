// API configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : `${window.location.protocol}//${window.location.hostname}:8080`;

// API service object
const API = {
    // Fetch countries
    async getCountries() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/countries`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching countries:', error);
            throw error;
        }
    },

    // Fetch airports for a country
    async getAirports(countryCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/airports?country=${countryCode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching airports:', error);
            throw error;
        }
    },

    // Fetch flights for an airport
    async getFlights(airportCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/flights?airport=${airportCode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching flights:', error);
            throw error;
        }
    }
};

// Export API for use in other modules
window.FlightAPI = API;
