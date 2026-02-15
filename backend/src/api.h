#ifndef API_H
#define API_H

#include <stddef.h>

// API response structure
typedef struct {
    char *data;
    size_t size;
} APIResponse;

// Function declarations
APIResponse fetch_flight_data(const char *airport_code);
void free_api_response(APIResponse *response);
char* fetch_url(const char *url);

#endif // API_H
