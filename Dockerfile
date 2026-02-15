# Multi-stage build for Flight Status Board
# Stage 1: Build the C backend using CMake
FROM gcc:latest AS build

# Install CMake and other build dependencies
RUN apt-get update && apt-get install -y cmake && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy backend source code and CMakeLists.txt
COPY backend/ /app/backend/

# Build the backend using CMake
WORKDIR /app/backend
RUN cmake . && make

# Stage 2: Create the runtime image with nginx
FROM nginx:stable

# Copy the compiled backend from the build stage
COPY --from=build /app/backend/flight-status-board /usr/bin/flight-status-backend

# Create the nginx html directory if it doesn't exist
RUN mkdir -p /usr/share/nginx/html

# Copy the frontend files
COPY frontend/ /usr/share/nginx/html/

# Expose ports (80 for nginx/frontend, 8080 for backend)
EXPOSE 80 8080

# Create a startup script to handle both services
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting Flight Status Board..."' >> /start.sh && \
    echo '# Start backend in background' >> /start.sh && \
    echo 'if [ -x /usr/bin/flight-status-backend ]; then' >> /start.sh && \
    echo '    /usr/bin/flight-status-backend &' >> /start.sh && \
    echo '    echo "Backend started on port 8080"' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '    echo "Backend not found, skipping"' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo '# Start nginx in foreground' >> /start.sh && \
    echo 'echo "Starting nginx on port 80..."' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Start both backend and nginx
CMD ["/start.sh"]