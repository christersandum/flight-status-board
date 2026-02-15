FROM nginx:alpine

# Create app directory
WORKDIR /usr/share/nginx/html

# Copy frontend files
COPY frontend/ .

# Create a startup script to handle PORT environment variable
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'PORT=${PORT:-80}' >> /docker-entrypoint.sh && \
    echo 'cat > /etc/nginx/conf.d/default.conf <<EOF' >> /docker-entrypoint.sh && \
    echo 'server {' >> /docker-entrypoint.sh && \
    echo '  listen $PORT;' >> /docker-entrypoint.sh && \
    echo '  server_name _;' >> /docker-entrypoint.sh && \
    echo '  root /usr/share/nginx/html;' >> /docker-entrypoint.sh && \
    echo '  index index.html;' >> /docker-entrypoint.sh && \
    echo '  location / {' >> /docker-entrypoint.sh && \
    echo '    try_files \$uri \$uri/ =404;' >> /docker-entrypoint.sh && \
    echo '  }' >> /docker-entrypoint.sh && \
    echo '}' >> /docker-entrypoint.sh && \
    echo 'EOF' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
