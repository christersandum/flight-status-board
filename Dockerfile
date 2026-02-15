# Multi-stage build for Flight Status Board
# Stage 1: Build the C backend with static linking
FROM gcc:latest AS build

# Set the working directory
WORKDIR /app

# Copy the backend source code
COPY ./backend /app/backend

# Compile the C backend statically so it works on Alpine
RUN gcc -static -o flight-status-backend /app/backend/src/main.c

# Stage 2: Create the runtime image with nginx
FROM nginx:alpine

# Copy the statically compiled backend from the build stage
COPY --from=build /app/flight-status-backend /usr/bin/flight-status-backend

# Make backend executable
RUN chmod +x /usr/bin/flight-status-backend

# Create a default frontend HTML page
# This provides a working landing page when frontend directory doesn't exist
RUN rm -rf /usr/share/nginx/html/* && \
    cat > /usr/share/nginx/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flight Status Board</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 800px;
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        p {
            font-size: 1.2em;
            line-height: 1.6;
            margin: 15px 0;
        }
        .status {
            background: rgba(255, 255, 255, 0.15);
            padding: 25px;
            border-radius: 15px;
            margin-top: 30px;
        }
        .status p {
            margin: 10px 0;
        }
        a {
            color: #fff;
            text-decoration: underline;
        }
        a:hover {
            color: #f0f0f0;
        }
        .emoji {
            font-size: 4em;
            margin-bottom: 20px;
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="emoji">✈️</span>
        <h1>Flight Status Board</h1>
        <p>Welcome to the Flight Status Board application!</p>
        <p>The application is successfully deployed and running.</p>
        <div class="status">
            <p><strong>Frontend:</strong> Running on port 80</p>
            <p><strong>Backend API:</strong> Running on port 8080</p>
            <p>Backend endpoint: <a href="/api" target="_blank">Test Backend API</a></p>
        </div>
    </div>
</body>
</html>
EOF

# Expose ports (80 for nginx frontend, 8080 for backend)
EXPOSE 80 8080

# Start the backend and serve the frontend with nginx
CMD ["sh", "-c", "/usr/bin/flight-status-backend & nginx -g 'daemon off;'"]