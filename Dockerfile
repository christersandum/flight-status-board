# Multi-stage Docker build for Flight Status Board
# Stage 1: Build the C backend
FROM gcc:11 as backend-builder

WORKDIR /app/backend

# Install dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend source files
COPY backend/ .

# Build using CMake
RUN mkdir -p build && \
    cd build && \
    cmake .. && \
    make

# Stage 2: Create the final image
FROM ubuntu:22.04

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libcurl4 \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy backend binary from builder
COPY --from=backend-builder /app/backend/build/flight-status-board /app/backend/

# Copy frontend files
COPY frontend/ /usr/share/nginx/html/

# Configure nginx
RUN echo 'server {' > /etc/nginx/sites-available/default && \
    echo '    listen 80 default_server;' >> /etc/nginx/sites-available/default && \
    echo '    listen [::]:80 default_server;' >> /etc/nginx/sites-available/default && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/sites-available/default && \
    echo '    index index.html;' >> /etc/nginx/sites-available/default && \
    echo '    server_name _;' >> /etc/nginx/sites-available/default && \
    echo '    location / {' >> /etc/nginx/sites-available/default && \
    echo '        try_files $uri $uri/ =404;' >> /etc/nginx/sites-available/default && \
    echo '    }' >> /etc/nginx/sites-available/default && \
    echo '}' >> /etc/nginx/sites-available/default

# Create startup script
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'echo "Starting Flight Status Board..."' >> /app/start.sh && \
    echo 'echo "Starting backend on port 8080..."' >> /app/start.sh && \
    echo '/app/backend/flight-status-board &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Backend started with PID: $BACKEND_PID"' >> /app/start.sh && \
    echo 'echo "Starting nginx on port 80..."' >> /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'NGINX_PID=$!' >> /app/start.sh && \
    echo 'echo "Nginx started with PID: $NGINX_PID"' >> /app/start.sh && \
    echo 'echo "Flight Status Board is ready!"' >> /app/start.sh && \
    echo 'echo "Backend API: http://0.0.0.0:8080"' >> /app/start.sh && \
    echo 'echo "Frontend: http://0.0.0.0:80"' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 80 8080

# Set environment variables
ENV PORT=80

# Start both services
CMD ["/app/start.sh"]

