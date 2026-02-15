FROM nginx:alpine

# Create app directory
WORKDIR /usr/share/nginx/html

# Copy frontend files
COPY frontend/ .

# Nginx config
RUN mkdir -p /etc/nginx/conf.d && \
    echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '  listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '  server_name _;' >> /etc/nginx/conf.d/default.conf && \
    echo '  root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '    try_files $uri $uri/ =404;' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
