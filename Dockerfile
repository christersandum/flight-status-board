# Use an official GCC compiler as base image
FROM gcc:13

# Set the working directory
WORKDIR /app

# Copy the backend source code with correct path
COPY backend/src/main.c /app/main.c

# Compile the C backend with optimization and warnings
RUN gcc -Wall -Wextra -O2 -o flight-status-backend /app/main.c

# Expose the port that the backend listens on
EXPOSE 8080

# Run the backend server
CMD ["/app/flight-status-backend"]