#include "flight_data.h"
#include "api.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Hardcoded country list for simplicity
static Country countries[] = {
    {"NO", "Norway"},
    {"SE", "Sweden"},
    {"DK", "Denmark"},
    {"FI", "Finland"},
    {"GB", "United Kingdom"},
    {"DE", "Germany"},
    {"FR", "France"},
    {"ES", "Spain"},
    {"IT", "Italy"},
    {"NL", "Netherlands"},
    {"US", "United States"},
    {"CA", "Canada"}
};

// Hardcoded airport list for major European airports
static Airport airports[] = {
    {"ENGM", "OSL", "Oslo Gardermoen Airport", "Oslo", "NO"},
    {"ENZV", "SVG", "Stavanger Airport", "Stavanger", "NO"},
    {"ENBR", "BGO", "Bergen Airport Flesland", "Bergen", "NO"},
    {"ENTC", "TOS", "Tromsø Airport", "Tromsø", "NO"},
    {"ESSA", "ARN", "Stockholm Arlanda Airport", "Stockholm", "SE"},
    {"ESGG", "GOT", "Göteborg Landvetter Airport", "Gothenburg", "SE"},
    {"EKCH", "CPH", "Copenhagen Airport", "Copenhagen", "DK"},
    {"EFHK", "HEL", "Helsinki-Vantaa Airport", "Helsinki", "FI"},
    {"EGLL", "LHR", "London Heathrow Airport", "London", "GB"},
    {"EGKK", "LGW", "London Gatwick Airport", "London", "GB"},
    {"EDDM", "MUC", "Munich Airport", "Munich", "DE"},
    {"EDDF", "FRA", "Frankfurt Airport", "Frankfurt", "DE"},
    {"LFPG", "CDG", "Charles de Gaulle Airport", "Paris", "FR"},
    {"LEMD", "MAD", "Madrid-Barajas Airport", "Madrid", "ES"},
    {"LIRF", "FCO", "Leonardo da Vinci Airport", "Rome", "IT"},
    {"EHAM", "AMS", "Amsterdam Schiphol Airport", "Amsterdam", "NL"},
    {"KJFK", "JFK", "John F. Kennedy Airport", "New York", "US"},
    {"KLAX", "LAX", "Los Angeles Airport", "Los Angeles", "US"},
    {"CYYZ", "YYZ", "Toronto Pearson Airport", "Toronto", "CA"}
};

// Get countries as JSON
char* get_countries_json() {
    size_t buffer_size = 4096;
    char *json = malloc(buffer_size);
    if (!json) return NULL;

    strcpy(json, "[");
    
    size_t count = sizeof(countries) / sizeof(countries[0]);
    for (size_t i = 0; i < count; i++) {
        char entry[256];
        snprintf(entry, sizeof(entry),
                 "%s{\"code\":\"%s\",\"name\":\"%s\"}",
                 i > 0 ? "," : "",
                 countries[i].code,
                 countries[i].name);
        strcat(json, entry);
    }
    
    strcat(json, "]");
    return json;
}

// Get airports for a country as JSON
char* get_airports_json(const char *country_code) {
    size_t buffer_size = 16384;
    char *json = malloc(buffer_size);
    if (!json) return NULL;

    strcpy(json, "[");
    int first = 1;
    
    size_t count = sizeof(airports) / sizeof(airports[0]);
    for (size_t i = 0; i < count; i++) {
        if (strcmp(airports[i].country, country_code) == 0) {
            char entry[512];
            snprintf(entry, sizeof(entry),
                     "%s{\"icao\":\"%s\",\"iata\":\"%s\",\"name\":\"%s\",\"city\":\"%s\"}",
                     first ? "" : ",",
                     airports[i].icao,
                     airports[i].iata,
                     airports[i].name,
                     airports[i].city);
            strcat(json, entry);
            first = 0;
        }
    }
    
    strcat(json, "]");
    return json;
}

// Generate mock flight data for demonstration (since OpenSky API might not have all data)
char* generate_mock_flights(const char *airport_code) {
    size_t buffer_size = 32768;
    char *json = malloc(buffer_size);
    if (!json) return NULL;

    strcpy(json, "[");
    
    // Generate 20 mock flights
    const char* airlines[] = {"SAS", "Norwegian", "KLM", "Lufthansa", "British Airways", 
                              "Air France", "Delta", "United", "Emirates", "Qatar Airways"};
    const char* destinations[] = {"London", "Paris", "Amsterdam", "Copenhagen", "Stockholm",
                                  "Berlin", "Rome", "Madrid", "New York", "Dubai"};
    const char* terminals[] = {"1", "2", "3", "A", "B"};
    const char* statuses[] = {"On Time", "Delayed", "Boarding", "Departed", "Cancelled"};
    
    for (int i = 0; i < 20; i++) {
        char entry[1024];
        time_t now = time(NULL);
        struct tm *t = localtime(&now);
        
        // Generate departure times throughout the day
        int hour = (t->tm_hour + i / 2) % 24;
        int min = (i * 15) % 60;
        
        int airline_idx = i % 10;
        int dest_idx = i % 10;
        int term_idx = i % 5;
        int status_idx = (i % 5 == 4) ? 1 : (i % 10 == 9 ? 4 : 0); // Occasional delays/cancellations
        
        snprintf(entry, sizeof(entry),
                 "%s{\"departure_time\":\"%02d:%02d\","
                 "\"flight_number\":\"%s%d\","
                 "\"airline\":\"%s\","
                 "\"destination\":\"%s\","
                 "\"terminal\":\"%s\","
                 "\"gate\":\"%c%d\","
                 "\"status\":\"%s\"}",
                 i > 0 ? "," : "",
                 hour, min,
                 airlines[airline_idx], 100 + i,
                 airlines[airline_idx],
                 destinations[dest_idx],
                 terminals[term_idx],
                 'A' + (i % 4), 1 + (i % 20),
                 statuses[status_idx]);
        strcat(json, entry);
    }
    
    strcat(json, "]");
    return json;
}

// Process flight data from API response
char* process_flight_data(const char *raw_data, const char *airport_code) {
    // For now, generate mock data as OpenSky API format is complex
    // In production, you would parse the JSON response here
    return generate_mock_flights(airport_code);
}

// Get flights for an airport as JSON
char* get_flights_json(const char *airport_code) {
    // Try to fetch real data from API
    APIResponse response = fetch_flight_data(airport_code);
    
    char *result;
    if (response.data && response.size > 0) {
        result = process_flight_data(response.data, airport_code);
        free_api_response(&response);
    } else {
        // Fallback to mock data
        result = generate_mock_flights(airport_code);
    }
    
    return result;
}
