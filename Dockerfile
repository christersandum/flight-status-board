# Use the official nginx alpine image as base
FROM nginx:alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy our custom HTML file
COPY index.html /usr/share/nginx/html/

# Copy custom nginx configuration (optional, nginx:alpine already has a default config)
# The default nginx config already serves /usr/share/nginx/html on port 80

# Ensure proper permissions
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
