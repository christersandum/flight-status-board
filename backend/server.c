/*
 * Flight Status Board - HTTP Server
 * 
 * A simple single-threaded HTTP server for serving flight status data.
 * 
 * NOTE: This implementation uses static buffers for simplicity and is designed
 * for single-threaded operation. For multi-threaded/production use, replace 
 * static buffers with thread-local storage or dynamically allocated memory.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <time.h>
#include <ctype.h>
#include <curl/curl.h>

#define PORT 8080
#define BUFFER_SIZE 65536
#define MAX_FLIGHTS 20

// Structure to hold flight data
typedef struct {
    char flight_number[20];
    char airline[50];
    char origin[50];
    char destination[50];
    char scheduled_time[30];
    char estimated_time[30];
    char status[50];
    char terminal[10];
    char gate[10];
    int delay_minutes;
} Flight;

// Callback function for curl to write response data
struct MemoryStruct {
    char *memory;
    size_t size;
};

static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;
    
    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if (!ptr) {
        printf("Error: not enough memory (realloc returned NULL)\n");
        return 0;
    }
    
    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;
    
    return realsize;
}

// Function to parse AviationStack response and convert to our format
char* parse_aviationstack_response(const char* api_response, const char* airport_code) {
    static char formatted_response[BUFFER_SIZE];
    
    // Simple parsing - look for flight data in the response
    // For now, we'll return a simplified version that extracts key fields
    // A full implementation would use a JSON parser library
    
    // Check if we have valid data
    if (!api_response || strstr(api_response, "\"data\"") == NULL) {
        return NULL;
    }
    
    // For simplicity, we'll create a basic parser
    // In production, use a proper JSON library like cJSON
    formatted_response[0] = '[';
    formatted_response[1] = '\0';
    
    int flight_count = 0;
    const char *ptr = api_response;
    
    // Look for flight objects in the response
    while ((ptr = strstr(ptr, "\"flight\":")) != NULL && flight_count < MAX_FLIGHTS) {
        char flight_number[20] = "";
        char airline_name[50] = "Unknown";
        char destination[10] = "";
        char scheduled_time[30] = "";
        char estimated_time[30] = "";
        char status[50] = "Scheduled";
        char terminal[10] = "-";
        char gate[10] = "-";
        int delay_minutes = 0;
        
        // Extract flight number
        const char *flight_start = strstr(ptr, "\"number\":\"");
        if (flight_start) {
            flight_start += 10;
            sscanf(flight_start, "%19[^\"]", flight_number);
        }
        
        // Extract airline name
        const char *airline_start = strstr(ptr, "\"airline\":");
        if (airline_start) {
            const char *name_start = strstr(airline_start, "\"name\":\"");
            if (name_start) {
                name_start += 8;
                sscanf(name_start, "%49[^\"]", airline_name);
            }
        }
        
        // Extract destination
        const char *arrival_start = strstr(ptr, "\"arrival\":");
        if (arrival_start) {
            const char *iata_start = strstr(arrival_start, "\"iata\":\"");
            if (iata_start && (iata_start - arrival_start) < 500) {
                iata_start += 8;
                sscanf(iata_start, "%9[^\"]", destination);
            }
        }
        
        // Extract departure scheduled time
        const char *dep_start = strstr(ptr, "\"departure\":");
        if (dep_start) {
            const char *sched_start = strstr(dep_start, "\"scheduled\":\"");
            if (sched_start && (sched_start - dep_start) < 500) {
                sched_start += 13;
                sscanf(sched_start, "%29[^\"]", scheduled_time);
            }
            
            const char *est_start = strstr(dep_start, "\"estimated\":\"");
            if (est_start && (est_start - dep_start) < 500) {
                est_start += 13;
                sscanf(est_start, "%29[^\"]", estimated_time);
            } else {
                strcpy(estimated_time, scheduled_time);
            }
            
            const char *term_start = strstr(dep_start, "\"terminal\":\"");
            if (term_start && (term_start - dep_start) < 500) {
                term_start += 12;
                sscanf(term_start, "%9[^\"]", terminal);
            }
            
            const char *gate_start = strstr(dep_start, "\"gate\":\"");
            if (gate_start && (gate_start - dep_start) < 500) {
                gate_start += 8;
                sscanf(gate_start, "%9[^\"]", gate);
            }
            
            const char *delay_start = strstr(dep_start, "\"delay\":");
            if (delay_start && (delay_start - dep_start) < 500) {
                delay_start += 8;
                sscanf(delay_start, "%d", &delay_minutes);
            }
        }
        
        // Extract flight status
        const char *status_start = strstr(ptr, "\"flight_status\":\"");
        if (status_start) {
            status_start += 17;
            char raw_status[50];
            sscanf(status_start, "%49[^\"]", raw_status);
            
            // Map AviationStack status to our status
            if (strcmp(raw_status, "scheduled") == 0) {
                strcpy(status, "Scheduled");
            } else if (strcmp(raw_status, "active") == 0) {
                strcpy(status, "On Time");
            } else if (strcmp(raw_status, "landed") == 0) {
                strcpy(status, "Landed");
            } else if (strcmp(raw_status, "cancelled") == 0) {
                strcpy(status, "Cancelled");
            } else if (strcmp(raw_status, "diverted") == 0) {
                strcpy(status, "Diverted");
            } else {
                strcpy(status, "On Time");
            }
            
            if (delay_minutes > 0) {
                strcpy(status, "Delayed");
            }
        }
        
        // Add flight to JSON array
        if (strlen(flight_number) > 0 && strlen(destination) > 0) {
            char flight_json[512];
            snprintf(flight_json, sizeof(flight_json),
                "%s{\"flight_number\":\"%s\",\"airline\":\"%s\",\"origin\":\"%s\",\"destination\":\"%s\",\"scheduled_time\":\"%s\",\"estimated_time\":\"%s\",\"status\":\"%s\",\"terminal\":\"%s\",\"gate\":\"%s\",\"delay_minutes\":%d}",
                flight_count > 0 ? "," : "",
                flight_number, airline_name, airport_code, destination,
                scheduled_time, estimated_time, status, terminal, gate, delay_minutes);
            
            strcat(formatted_response, flight_json);
            flight_count++;
        }
        
        ptr += 100; // Move forward to find next flight
    }
    
    strcat(formatted_response, "]");
    
    if (flight_count > 0) {
        return formatted_response;
    }
    
    return NULL;
}

// Function to make HTTP request to flight API
// NOTE: Uses static buffer - safe for single-threaded operation only
char* fetch_flight_data(const char* airport_code) {
    static char response[BUFFER_SIZE];
    
    // Read API key from config file
    FILE *config = fopen("config.txt", "r");
    char api_key[100] = "";
    
    if (config) {
        char line[256];
        while (fgets(line, sizeof(line), config)) {
            if (strncmp(line, "API_KEY=", 8) == 0) {
                sscanf(line, "API_KEY=%s", api_key);
                break;
            }
        }
        fclose(config);
    }
    
    // If no API key, return mock data for demonstration
    if (strlen(api_key) == 0) {
        printf("No API key found - using mock data\n");
        snprintf(response, BUFFER_SIZE,
            "["
            "{\"flight_number\":\"AA123\",\"airline\":\"American Airlines\",\"origin\":\"%s\",\"destination\":\"JFK\",\"scheduled_time\":\"2026-02-15T10:30:00\",\"estimated_time\":\"2026-02-15T10:30:00\",\"status\":\"On Time\",\"terminal\":\"1\",\"gate\":\"A12\",\"delay_minutes\":0},"
            "{\"flight_number\":\"UA456\",\"airline\":\"United Airlines\",\"origin\":\"%s\",\"destination\":\"LAX\",\"scheduled_time\":\"2026-02-15T11:00:00\",\"estimated_time\":\"2026-02-15T11:15:00\",\"status\":\"Delayed\",\"terminal\":\"2\",\"gate\":\"B5\",\"delay_minutes\":15},"
            "{\"flight_number\":\"DL789\",\"airline\":\"Delta Airlines\",\"origin\":\"%s\",\"destination\":\"ORD\",\"scheduled_time\":\"2026-02-15T11:30:00\",\"estimated_time\":\"2026-02-15T11:30:00\",\"status\":\"On Time\",\"terminal\":\"1\",\"gate\":\"A8\",\"delay_minutes\":0},"
            "{\"flight_number\":\"BA101\",\"airline\":\"British Airways\",\"origin\":\"%s\",\"destination\":\"LHR\",\"scheduled_time\":\"2026-02-15T12:00:00\",\"estimated_time\":\"2026-02-15T12:00:00\",\"status\":\"Boarding\",\"terminal\":\"3\",\"gate\":\"C15\",\"delay_minutes\":0},"
            "{\"flight_number\":\"LH202\",\"airline\":\"Lufthansa\",\"origin\":\"%s\",\"destination\":\"FRA\",\"scheduled_time\":\"2026-02-15T12:30:00\",\"estimated_time\":\"2026-02-15T12:45:00\",\"status\":\"Delayed\",\"terminal\":\"3\",\"gate\":\"C20\",\"delay_minutes\":15},"
            "{\"flight_number\":\"AF303\",\"airline\":\"Air France\",\"origin\":\"%s\",\"destination\":\"CDG\",\"scheduled_time\":\"2026-02-15T13:00:00\",\"estimated_time\":\"2026-02-15T13:00:00\",\"status\":\"On Time\",\"terminal\":\"3\",\"gate\":\"C25\",\"delay_minutes\":0},"
            "{\"flight_number\":\"KL404\",\"airline\":\"KLM\",\"origin\":\"%s\",\"destination\":\"AMS\",\"scheduled_time\":\"2026-02-15T13:30:00\",\"estimated_time\":\"2026-02-15T13:30:00\",\"status\":\"Boarding\",\"terminal\":\"2\",\"gate\":\"B10\",\"delay_minutes\":0},"
            "{\"flight_number\":\"SQ505\",\"airline\":\"Singapore Airlines\",\"origin\":\"%s\",\"destination\":\"SIN\",\"scheduled_time\":\"2026-02-15T14:00:00\",\"estimated_time\":\"2026-02-15T14:00:00\",\"status\":\"On Time\",\"terminal\":\"3\",\"gate\":\"C30\",\"delay_minutes\":0},"
            "{\"flight_number\":\"EK606\",\"airline\":\"Emirates\",\"origin\":\"%s\",\"destination\":\"DXB\",\"scheduled_time\":\"2026-02-15T14:30:00\",\"estimated_time\":\"2026-02-15T14:30:00\",\"status\":\"On Time\",\"terminal\":\"3\",\"gate\":\"C35\",\"delay_minutes\":0},"
            "{\"flight_number\":\"QR707\",\"airline\":\"Qatar Airways\",\"origin\":\"%s\",\"destination\":\"DOH\",\"scheduled_time\":\"2026-02-15T15:00:00\",\"estimated_time\":\"2026-02-15T15:20:00\",\"status\":\"Delayed\",\"terminal\":\"3\",\"gate\":\"C40\",\"delay_minutes\":20},"
            "{\"flight_number\":\"TK808\",\"airline\":\"Turkish Airlines\",\"origin\":\"%s\",\"destination\":\"IST\",\"scheduled_time\":\"2026-02-15T15:30:00\",\"estimated_time\":\"2026-02-15T15:30:00\",\"status\":\"On Time\",\"terminal\":\"2\",\"gate\":\"B15\",\"delay_minutes\":0},"
            "{\"flight_number\":\"NH909\",\"airline\":\"ANA\",\"origin\":\"%s\",\"destination\":\"NRT\",\"scheduled_time\":\"2026-02-15T16:00:00\",\"estimated_time\":\"2026-02-15T16:00:00\",\"status\":\"On Time\",\"terminal\":\"3\",\"gate\":\"C45\",\"delay_minutes\":0},"
            "{\"flight_number\":\"JL010\",\"airline\":\"Japan Airlines\",\"origin\":\"%s\",\"destination\":\"HND\",\"scheduled_time\":\"2026-02-15T16:30:00\",\"estimated_time\":\"2026-02-15T16:30:00\",\"status\":\"Boarding\",\"terminal\":\"3\",\"gate\":\"C50\",\"delay_minutes\":0},"
            "{\"flight_number\":\"CX111\",\"airline\":\"Cathay Pacific\",\"origin\":\"%s\",\"destination\":\"HKG\",\"scheduled_time\":\"2026-02-15T17:00:00\",\"estimated_time\":\"2026-02-15T17:10:00\",\"status\":\"Delayed\",\"terminal\":\"3\",\"gate\":\"C55\",\"delay_minutes\":10},"
            "{\"flight_number\":\"VS222\",\"airline\":\"Virgin Atlantic\",\"origin\":\"%s\",\"destination\":\"LGW\",\"scheduled_time\":\"2026-02-15T17:30:00\",\"estimated_time\":\"2026-02-15T17:30:00\",\"status\":\"On Time\",\"terminal\":\"2\",\"gate\":\"B20\",\"delay_minutes\":0},"
            "{\"flight_number\":\"AC333\",\"airline\":\"Air Canada\",\"origin\":\"%s\",\"destination\":\"YYZ\",\"scheduled_time\":\"2026-02-15T18:00:00\",\"estimated_time\":\"2026-02-15T18:00:00\",\"status\":\"On Time\",\"terminal\":\"1\",\"gate\":\"A15\",\"delay_minutes\":0},"
            "{\"flight_number\":\"IB444\",\"airline\":\"Iberia\",\"origin\":\"%s\",\"destination\":\"MAD\",\"scheduled_time\":\"2026-02-15T18:30:00\",\"estimated_time\":\"2026-02-15T18:30:00\",\"status\":\"Boarding\",\"terminal\":\"2\",\"gate\":\"B25\",\"delay_minutes\":0},"
            "{\"flight_number\":\"AZ555\",\"airline\":\"ITA Airways\",\"origin\":\"%s\",\"destination\":\"FCO\",\"scheduled_time\":\"2026-02-15T19:00:00\",\"estimated_time\":\"2026-02-15T19:15:00\",\"status\":\"Delayed\",\"terminal\":\"3\",\"gate\":\"C60\",\"delay_minutes\":15},"
            "{\"flight_number\":\"SK666\",\"airline\":\"SAS\",\"origin\":\"%s\",\"destination\":\"CPH\",\"scheduled_time\":\"2026-02-15T19:30:00\",\"estimated_time\":\"2026-02-15T19:30:00\",\"status\":\"On Time\",\"terminal\":\"2\",\"gate\":\"B30\",\"delay_minutes\":0},"
            "{\"flight_number\":\"LX777\",\"airline\":\"Swiss\",\"origin\":\"%s\",\"destination\":\"ZRH\",\"scheduled_time\":\"2026-02-15T20:00:00\",\"estimated_time\":\"2026-02-15T20:00:00\",\"status\":\"On Time\",\"terminal\":\"3\",\"gate\":\"C65\",\"delay_minutes\":0}"
            "]",
            airport_code, airport_code, airport_code, airport_code, airport_code,
            airport_code, airport_code, airport_code, airport_code, airport_code,
            airport_code, airport_code, airport_code, airport_code, airport_code,
            airport_code, airport_code, airport_code, airport_code, airport_code);
        return response;
    }
    
    // Use AviationStack API with the provided key
    printf("Using AviationStack API for airport: %s\n", airport_code);
    
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;
    
    chunk.memory = malloc(1);
    chunk.size = 0;
    
    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl = curl_easy_init();
    
    if (!curl) {
        free(chunk.memory);
        printf("Failed to initialize curl\n");
        return response;
    }
    
    // Build API URL
    char url[512];
    snprintf(url, sizeof(url),
        "http://api.aviationstack.com/v1/flights?access_key=%s&dep_iata=%s&limit=%d",
        api_key, airport_code, MAX_FLIGHTS);
    
    // Set curl options
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "FlightStatusBoard/1.0");
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);
    
    // Perform request
    res = curl_easy_perform(curl);
    
    if (res != CURLE_OK) {
        fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
        free(chunk.memory);
        curl_easy_cleanup(curl);
        curl_global_cleanup();
        // Return mock data on error
        snprintf(response, BUFFER_SIZE, "[]");
        return response;
    }
    
    // Parse and format the response
    char *parsed = parse_aviationstack_response(chunk.memory, airport_code);
    
    if (parsed) {
        strncpy(response, parsed, BUFFER_SIZE - 1);
        response[BUFFER_SIZE - 1] = '\0';
        printf("Successfully fetched and parsed %lu bytes from AviationStack\n", chunk.size);
    } else {
        printf("Failed to parse API response, using empty array\n");
        snprintf(response, BUFFER_SIZE, "[]");
    }
    
    // Cleanup
    free(chunk.memory);
    curl_easy_cleanup(curl);
    curl_global_cleanup();
    
    return response;
}

// Function to send HTTP response
void send_response(int client_socket, const char* status, const char* content_type, const char* body) {
    char response[BUFFER_SIZE];
    int body_len = strlen(body);
    
    snprintf(response, BUFFER_SIZE,
        "HTTP/1.1 %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %d\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Connection: close\r\n"
        "\r\n"
        "%s",
        status, content_type, body_len, body);
    
    send(client_socket, response, strlen(response), 0);
}

// Function to serve static files
void serve_file(int client_socket, const char* filepath) {
    FILE *file = fopen(filepath, "rb");
    if (!file) {
        const char* body = "{\"error\":\"File not found\"}";
        send_response(client_socket, "404 Not Found", "application/json", body);
        return;
    }
    
    // Determine content type
    const char* content_type = "text/plain";
    if (strstr(filepath, ".html")) content_type = "text/html";
    else if (strstr(filepath, ".css")) content_type = "text/css";
    else if (strstr(filepath, ".js")) content_type = "application/javascript";
    else if (strstr(filepath, ".json")) content_type = "application/json";
    
    // Read file content
    fseek(file, 0, SEEK_END);
    long file_size = ftell(file);
    fseek(file, 0, SEEK_SET);
    
    char *file_content = malloc(file_size + 1);
    if (!file_content) {
        fclose(file);
        const char* body = "{\"error\":\"Memory allocation failed\"}";
        send_response(client_socket, "500 Internal Server Error", "application/json", body);
        return;
    }
    
    size_t bytes_read = fread(file_content, 1, file_size, file);
    if (bytes_read != (size_t)file_size) {
        fclose(file);
        free(file_content);
        const char* body = "{\"error\":\"Failed to read file\"}";
        send_response(client_socket, "500 Internal Server Error", "application/json", body);
        return;
    }
    
    file_content[file_size] = '\0';
    fclose(file);
    
    send_response(client_socket, "200 OK", content_type, file_content);
    free(file_content);
}

// Function to handle HTTP requests
void handle_request(int client_socket) {
    char buffer[BUFFER_SIZE];
    int bytes_read = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
    
    if (bytes_read <= 0) {
        close(client_socket);
        return;
    }
    
    buffer[bytes_read] = '\0';
    
    // Parse request line
    char method[10], path[256], version[10];
    sscanf(buffer, "%s %s %s", method, path, version);
    
    printf("Request: %s %s\n", method, path);
    
    // Handle API endpoints
    if (strncmp(path, "/api/flights", 12) == 0) {
        // Extract airport parameter
        char airport[10] = "JFK";  // Default airport
        char* query = strchr(path, '?');
        if (query) {
            char* airport_param = strstr(query, "airport=");
            if (airport_param) {
                sscanf(airport_param, "airport=%9[^&]", airport);
            }
        }
        
        char* flight_data = fetch_flight_data(airport);
        send_response(client_socket, "200 OK", "application/json", flight_data);
    }
    else if (strncmp(path, "/api/airports", 13) == 0) {
        const char* airports_json = "["
            "{\"code\":\"JFK\",\"name\":\"John F. Kennedy International\",\"city\":\"New York\"},"
            "{\"code\":\"LAX\",\"name\":\"Los Angeles International\",\"city\":\"Los Angeles\"},"
            "{\"code\":\"ORD\",\"name\":\"O'Hare International\",\"city\":\"Chicago\"},"
            "{\"code\":\"LHR\",\"name\":\"Heathrow\",\"city\":\"London\"},"
            "{\"code\":\"CDG\",\"name\":\"Charles de Gaulle\",\"city\":\"Paris\"},"
            "{\"code\":\"FRA\",\"name\":\"Frankfurt\",\"city\":\"Frankfurt\"},"
            "{\"code\":\"AMS\",\"name\":\"Amsterdam Schiphol\",\"city\":\"Amsterdam\"},"
            "{\"code\":\"DXB\",\"name\":\"Dubai International\",\"city\":\"Dubai\"},"
            "{\"code\":\"SIN\",\"name\":\"Singapore Changi\",\"city\":\"Singapore\"},"
            "{\"code\":\"HKG\",\"name\":\"Hong Kong International\",\"city\":\"Hong Kong\"}"
            "]";
        send_response(client_socket, "200 OK", "application/json", airports_json);
    }
    else if (strcmp(path, "/") == 0) {
        serve_file(client_socket, "public/index.html");
    }
    else if (strncmp(path, "/", 1) == 0) {
        // Validate path to prevent directory traversal
        if (strstr(path, "..") != NULL) {
            const char* body = "{\"error\":\"Invalid path\"}";
            send_response(client_socket, "400 Bad Request", "application/json", body);
        } else {
            char filepath[512];
            snprintf(filepath, sizeof(filepath), "public%s", path);
            serve_file(client_socket, filepath);
        }
    }
    else {
        const char* body = "{\"error\":\"Not found\"}";
        send_response(client_socket, "404 Not Found", "application/json", body);
    }
    
    close(client_socket);
}

int main() {
    int server_socket, client_socket;
    struct sockaddr_in server_addr, client_addr;
    socklen_t client_len = sizeof(client_addr);
    
    // Create socket
    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket < 0) {
        perror("Error creating socket");
        return 1;
    }
    
    // Set socket options
    int opt = 1;
    if (setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("Warning: Failed to set SO_REUSEADDR");
        // Continue anyway - not fatal
    }
    
    // Bind socket
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);
    
    if (bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("Error binding socket");
        close(server_socket);
        return 1;
    }
    
    // Listen for connections
    if (listen(server_socket, 10) < 0) {
        perror("Error listening");
        close(server_socket);
        return 1;
    }
    
    printf("Flight Status Board Server running on http://localhost:%d\n", PORT);
    printf("Press Ctrl+C to stop the server\n\n");
    
    // Accept connections
    while (1) {
        client_socket = accept(server_socket, (struct sockaddr*)&client_addr, &client_len);
        if (client_socket < 0) {
            perror("Error accepting connection");
            continue;
        }
        
        handle_request(client_socket);
    }
    
    close(server_socket);
    return 0;
}
