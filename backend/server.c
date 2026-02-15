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

// Function to make HTTP request to flight API
// NOTE: Uses static buffer - safe for single-threaded operation only
char* fetch_flight_data(const char* airport_code) {
    int sockfd;
    struct sockaddr_in serv_addr;
    struct hostent *server;
    char request[1024];
    static char response[BUFFER_SIZE];
    int bytes_received;
    
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
    
    // Real API integration would go here
    // For now, return mock data
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
    
    fread(file_content, 1, file_size, file);
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
        char filepath[512];
        snprintf(filepath, sizeof(filepath), "public%s", path);
        serve_file(client_socket, filepath);
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
    setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
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
