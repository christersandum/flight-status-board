#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>

// Function to handle HTTP requests
void handle_request(int client_socket) {
    char buffer[1024];
    read(client_socket, buffer, sizeof(buffer));

    // Simple response
    const char *response_template = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: %d\r\n\r\n%s";
    const char *response_body = "<html><body><h1>Flight Status Board</h1><p>Welcome to the Flight Status Board application!</p></body></html>";
    char response[1024];
    sprintf(response, response_template, strlen(response_body), response_body);

    write(client_socket, response, strlen(response));
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

    // Set up the server address struct
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(8080);

    // Bind the socket
    if (bind(server_socket, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Error on binding");
        return 1;
    }

    // Listen for incoming connections
    listen(server_socket, 5);
    printf("Server running on port 8080\n");

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