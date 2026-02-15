# Use an official GCC compiler as base image
FROM gcc:latest

# Set the working directory
WORKDIR /app

# Copy the backend source code with correct path
COPY backend/src/main.c /app/main.c

# Compile the C backend
RUN gcc -o flight-status-backend /app/main.c

# Expose the port that the backend listens on
EXPOSE 8080

# Run the backend server
CMD ["/app/flight-status-backend"]