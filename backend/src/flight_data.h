#ifndef FLIGHT_DATA_H
#define FLIGHT_DATA_H

// Flight structure
typedef struct {
    char departure_time[64];
    char flight_number[32];
    char airline[128];
    char terminal[16];
    char gate[16];
    char status[32];
    char destination[128];
    char aircraft_type[64];
} Flight;

// Country structure
typedef struct {
    char code[8];
    char name[128];
} Country;

// Airport structure
typedef struct {
    char icao[8];
    char iata[8];
    char name[256];
    char city[128];
    char country[8];
} Airport;

// Function declarations
char* get_countries_json();
char* get_airports_json(const char *country_code);
char* get_flights_json(const char *airport_code);
char* process_flight_data(const char *raw_data, const char *airport_code);

#endif // FLIGHT_DATA_H
