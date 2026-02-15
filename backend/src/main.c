#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <time.h>
#include "flight_data.h"
#include "api.h"

// Extract query parameter from URL
char* get_query_param(const char *url, const char *param_name) {
    char *param_start = strstr(url, param_name);
    if (!param_start) return NULL;
    
    param_start += strlen(param_name);
    if (*param_start != '=') return NULL;
    param_start++;
    
    char *param_end = strchr(param_start, '&');
    if (!param_end) param_end = strchr(param_start, ' ');
    if (!param_end) param_end = param_start + strlen(param_start);
    
    size_t len = param_end - param_start;
    char *result = malloc(len + 1);
    if (result) {
        strncpy(result, param_start, len);
        result[len] = '\0';
    }
    return result;
}

// Send HTTP response
void send_response(int client_socket, int status_code, const char *status_text, 
                   const char *content_type, const char *body) {
    char header[1024];
    snprintf(header, sizeof(header),
             "HTTP/1.1 %d %s\r\n"
             "Content-Type: %s\r\n"
             "Content-Length: %zu\r\n"
             "Access-Control-Allow-Origin: *\r\n"
             "Access-Control-Allow-Methods: GET, OPTIONS\r\n"
             "Access-Control-Allow-Headers: Content-Type\r\n"
             "Connection: close\r\n"
             "\r\n",
             status_code, status_text, content_type, strlen(body));
    
    write(client_socket, header, strlen(header));
    write(client_socket, body, strlen(body));
}

// Handle API requests
void handle_api_request(int client_socket, const char *path, const char *query) {
    char *response_body = NULL;
    
    // Route: /api/countries
    if (strncmp(path, "/api/countries", 14) == 0) {
        response_body = get_countries_json();
        if (response_body) {
            send_response(client_socket, 200, "OK", "application/json", response_body);
            free(response_body);
        } else {
            send_response(client_socket, 500, "Internal Server Error", 
                         "application/json", "{\"error\":\"Failed to get countries\"}");
        }
    }
    // Route: /api/airports?country=XX
    else if (strncmp(path, "/api/airports", 13) == 0) {
        char *country = get_query_param(query, "country");
        if (country) {
            response_body = get_airports_json(country);
            free(country);
            
            if (response_body) {
                send_response(client_socket, 200, "OK", "application/json", response_body);
                free(response_body);
            } else {
                send_response(client_socket, 500, "Internal Server Error",
                             "application/json", "{\"error\":\"Failed to get airports\"}");
            }
        } else {
            send_response(client_socket, 400, "Bad Request",
                         "application/json", "{\"error\":\"Missing country parameter\"}");
        }
    }
    // Route: /api/flights?airport=ICAO
    else if (strncmp(path, "/api/flights", 12) == 0) {
        char *airport = get_query_param(query, "airport");
        if (!airport) {
            airport = strdup("ENGM"); // Default to Oslo
        }
        
        response_body = get_flights_json(airport);
        free(airport);
        
        if (response_body) {
            send_response(client_socket, 200, "OK", "application/json", response_body);
            free(response_body);
        } else {
            send_response(client_socket, 500, "Internal Server Error",
                         "application/json", "{\"error\":\"Failed to get flights\"}");
        }
    }
    // Route: /health (for Railway health checks)
    else if (strncmp(path, "/health", 7) == 0) {
        send_response(client_socket, 200, "OK", "application/json", 
                     "{\"status\":\"healthy\",\"service\":\"flight-status-board\"}");
    }
    // Unknown route
    else {
        send_response(client_socket, 404, "Not Found",
                     "application/json", "{\"error\":\"Endpoint not found\"}");
    }
}

// Function to handle HTTP requests
void handle_request(int client_socket) {
    char buffer[4096];
    ssize_t bytes_read = read(client_socket, buffer, sizeof(buffer) - 1);
    
    if (bytes_read <= 0) {
        close(client_socket);
        return;
    }
    
    buffer[bytes_read] = '\0';
    
    // Parse HTTP request line
    char method[16], path[512], version[16];
    if (sscanf(buffer, "%15s %511s %15s", method, path, version) != 3) {
        send_response(client_socket, 400, "Bad Request",
                     "text/plain", "Invalid HTTP request");
        close(client_socket);
        return;
    }
    
    printf("[%s] %s %s\n", method, path, version);
    
    // Handle OPTIONS for CORS
    if (strcmp(method, "OPTIONS") == 0) {
        send_response(client_socket, 200, "OK", "text/plain", "");
        close(client_socket);
        return;
    }
    
    // Only handle GET requests
    if (strcmp(method, "GET") != 0) {
        send_response(client_socket, 405, "Method Not Allowed",
                     "text/plain", "Method not allowed");
        close(client_socket);
        return;
    }
    
    // Split path and query string
    char *query = strchr(path, '?');
    if (query) {
        *query = '\0';
        query++;
    } else {
        query = "";
    }
    
    // Handle API routes
    if (strncmp(path, "/api/", 5) == 0 || strcmp(path, "/health") == 0) {
        handle_api_request(client_socket, path, query);
    } else {
        send_response(client_socket, 404, "Not Found",
                     "text/plain", "Not found");
    }
    
    close(client_socket);
}

// Main function to create server
int main() {
    int server_socket, client_socket;
    struct sockaddr_in server_addr, client_addr;
    socklen_t client_addr_len = sizeof(client_addr);

    // Create socket
    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket < 0) {
        perror("Error opening socket");
        return 1;
    }

    // Set socket options to reuse address
    int opt = 1;
    if (setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt failed");
        close(server_socket);
        return 1;
    }

    // Set up the server address struct
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(8080);

    // Bind the socket
    if (bind(server_socket, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Error on binding");
        close(server_socket);
        return 1;
    }

    // Listen for incoming connections
    if (listen(server_socket, 10) < 0) {
        perror("Error on listen");
        close(server_socket);
        return 1;
    }
    
    printf("===========================================\n");
    printf("Flight Status Board Backend Server\n");
    printf("===========================================\n");
    printf("Server running on port 8080\n");
    printf("API Endpoints:\n");
    printf("  GET /api/countries\n");
    printf("  GET /api/airports?country=XX\n");
    printf("  GET /api/flights?airport=ICAO\n");
    printf("  GET /health\n");
    printf("===========================================\n");

    while (1) {
        // Accept a connection
        client_socket = accept(server_socket, (struct sockaddr *)&client_addr, &client_addr_len);
        if (client_socket < 0) {
            perror("Error on accept");
            continue;
        }
        
        // Handle the request
        handle_request(client_socket);
    }

    close(server_socket);
    return 0;
}