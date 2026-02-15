FROM nginx:alpine

# Create app directory
WORKDIR /usr/share/nginx/html

# Create a simple working index page
RUN echo '<!DOCTYPE html>' > index.html && \
    echo '<html>' >> index.html && \
    echo '<head>' >> index.html && \
    echo '  <title>Flight Status Board</title>' >> index.html && \
    echo '  <style>' >> index.html && \
    echo '    body { font-family: Arial; background: #1a1a1a; color: #00ff00; text-align: center; padding: 50px; }' >> index.html && \
    echo '    h1 { font-size: 3em; }' >> index.html && \
    echo '    .status { background: #222; padding: 40px; border-radius: 8px; display: inline-block; }' >> index.html && \
    echo '  </style>' >> index.html && \
    echo '</head>' >> index.html && \
    echo '<body>' >> index.html && \
    echo '  <div class="status">' >> index.html && \
    echo '    <h1>✈️ Flight Status Board</h1>' >> index.html && \
    echo '    <p style="font-size: 1.2em;">✅ Successfully Deployed to Railway!</p>' >> index.html && \
    echo '    <p>Your application is now live and running</p>' >> index.html && \
    echo '  </div>' >> index.html && \
    echo '</body>' >> index.html && \
    echo '</html>' >> index.html

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
