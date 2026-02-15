# Use an official C compiler as a parent image
FROM gcc:latest as build

# Set the working directory
WORKDIR /app

# Copy the source code to the working directory
COPY backend/src /app/src

# Compile the C backend
RUN gcc -o flight-status-backend /app/src/main.c


# Use a lightweight web server for the frontend
FROM nginx:alpine

# Copy the compiled backend from the build stage
COPY --from=build /app/flight-status-backend /usr/bin/flight-status-backend

# Create a default frontend page
RUN mkdir -p /usr/share/nginx/html && \
    echo '<html><body><h1>Flight Status Board</h1><p>Backend running on port 8080</p></body></html>' > /usr/share/nginx/html/index.html

# Expose ports
EXPOSE 80

# Start the backend and serve the frontend
CMD ["sh", "-c", "/usr/bin/flight-status-backend & nginx -g 'daemon off;' "]